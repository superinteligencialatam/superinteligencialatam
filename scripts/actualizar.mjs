/**
 * SUPERINTELIGENCIA LATAM — Actualización bajo demanda
 *
 * Investiga cada país del archivo con Claude + búsqueda web y agrega los
 * hallazgos nuevos a data/archivo.json como una nueva "actualización", cada
 * uno asignado a una etapa del camino a la singularidad. No se ejecuta solo:
 * lo lanza el botón "Buscar novedades" a través del workflow de GitHub Actions.
 *
 *   ANTHROPIC_API_KEY=... node scripts/actualizar.mjs            # todos los países
 *   PAISES=br,cl ANTHROPIC_API_KEY=... node scripts/actualizar.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import fs from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const ARCHIVO = fileURLToPath(new URL("../data/archivo.json", import.meta.url));
const MODELO = "claude-opus-5";
const CONCURRENCIA = 3;
const MAX_POR_PAIS = 6;

const client = new Anthropic();

const SISTEMA = `Eres el investigador de Superinteligencia Latam, un archivo abierto de hechos verificables sobre inteligencia artificial en América Latina y el Caribe, con énfasis en su regulación.

Qué registra el archivo:
- Leyes, proyectos de ley y su avance en el congreso, reglamentos, decretos y resoluciones.
- Estrategias y políticas nacionales, autoridades o agencias nuevas, fallos judiciales.
- Acuerdos y declaraciones regionales o multilaterales.
- Hitos concretos de industria, investigación e infraestructura (inversiones anunciadas, centros de datos, modelos regionales, supercomputadores).

Criterios:
- Solo hechos con fecha, no opiniones ni análisis sin un hecho nuevo.
- Prefiere la fuente primaria u oficial (gaceta, congreso, ministerio, organismo). Si no existe, un medio reputado.
- Cada hallazgo necesita la URL concreta del documento o comunicado, nunca la portada del sitio.
- Si no encuentras nada nuevo y verificable, dilo claramente. Es mejor no reportar nada que reportar algo dudoso.`;

/* ---------- Investigación (búsqueda web) ---------- */

function promptInvestigacion(codigo, archivo) {
  const pais = archivo.paises[codigo];
  const existentes = archivo.entradas
    .filter((e) => e.pais === codigo)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((e) => `- ${e.fecha} · ${e.titulo} · ${e.fuentes.map((f) => f.url).join(" ")}`)
    .join("\n") || "(ninguna)";
  const estado = archivo.estado_paises[codigo];
  const ultima = archivo.actualizaciones.at(-1).fecha.slice(0, 10);
  const conEvidencia = new Set(archivo.entradas.filter((e) => e.pais === codigo && e.etapa).map((e) => e.etapa));
  const etapas = archivo.etapas
    .map((e) => `- ${e.nombre}: ${e.descripcion}${conEvidencia.has(e.id) ? " (ya registrada)" : " (SIN evidencia en el archivo)"}`)
    .join("\n");
  const alcance = codigo === "regional"
    ? "Ámbito: América Latina y el Caribe en conjunto (organismos regionales y multilaterales como CEPAL, UNESCO, OEA, CAF, BID, cumbres ministeriales, proyectos regionales como Latam-GPT). No incluyas hechos de un solo país."
    : `País: ${pais.nombre}.`;

  return `${alcance}

Hoy es ${new Date().toISOString().slice(0, 10)}. La última actualización del archivo fue el ${ultima}.
${estado ? `Estado regulatorio registrado: ${estado.resumen}\n` : ""}
Entradas que ya están en el archivo (no las repitas):
${existentes}

El archivo mide el avance hacia la singularidad con estas etapas:
${etapas}

Tarea:
1. Busca desarrollos nuevos desde el ${ultima}.
2. Para cada etapa SIN evidencia, busca si ${codigo === "regional" ? "la región" : "el país"} ya la cumplió (sin importar la fecha) y reporta el hecho que lo demuestra.
3. Busca también otros hitos importantes desde 2023 que falten en el archivo.
Reporta como máximo ${MAX_POR_PAIS} hallazgos, los más relevantes primero. Para cada uno indica fecha exacta (o mes si no hay día), qué pasó, por qué importa y la URL concreta de la fuente. Al final, di en una línea si el estado regulatorio registrado sigue siendo correcto o cómo cambió.`;
}

// Recoge todas las URLs que la búsqueda web devolvió de verdad, para descartar
// cualquier fuente que no provenga de la investigación.
function urlsVistas(contenido, conjunto) {
  for (const b of contenido) {
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content) if (r.url) conjunto.add(normalizarURL(r.url));
    }
    if (b.type === "web_fetch_tool_result" && b.content?.url) conjunto.add(normalizarURL(b.content.url));
    if (b.type === "text") for (const c of b.citations || []) if (c.url) conjunto.add(normalizarURL(c.url));
  }
}

async function investigar(codigo, archivo) {
  const messages = [{ role: "user", content: promptInvestigacion(codigo, archivo) }];
  const vistas = new Set();

  for (let intento = 0; intento < 6; intento++) {
    const mensaje = await client.beta.messages
      .stream({
        model: MODELO,
        max_tokens: 32000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        system: SISTEMA,
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 12 },
          { type: "web_fetch_20260209", name: "web_fetch", max_uses: 8 },
        ],
        messages,
      })
      .finalMessage();

    urlsVistas(mensaje.content, vistas);

    if (mensaje.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: mensaje.content });
      continue;
    }
    if (mensaje.stop_reason === "refusal") throw new Error("la solicitud fue rechazada");

    const informe = mensaje.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    return { informe, vistas };
  }
  throw new Error("la investigación no terminó tras varios intentos");
}

/* ---------- Extracción estructurada ---------- */

function esquemaHallazgos(archivo) {
  return z.object({
    entradas: z.array(z.object({
      fecha: z.string().describe("AAAA-MM-DD, o AAAA-MM si solo se conoce el mes"),
      categoria: z.enum(Object.keys(archivo.categorias)),
      etapa: z.enum([...archivo.etapas.map((e) => e.id), "ninguna"])
        .describe("La etapa del camino que este hecho demuestra, o 'ninguna' si no demuestra ninguna"),
      titulo: z.string().describe("Titular corto en español, estilo periodístico"),
      resumen: z.string().describe("Uno o dos párrafos en español, separados por una línea en blanco"),
      fuentes: z.array(z.object({ nombre: z.string(), url: z.string() })),
      etiquetas: z.array(z.string()),
    })),
    estado: z.object({
      cambio: z.boolean().describe("true solo si el informe muestra que el estado regulatorio registrado cambió"),
      nivel: z.enum(Object.keys(archivo.niveles)),
      resumen: z.string(),
    }),
  });
}

async function extraer(codigo, archivo, informe) {
  const estado = archivo.estado_paises[codigo];
  const respuesta = await client.messages.parse({
    model: MODELO,
    max_tokens: 16000,
    system: `Conviertes informes de investigación en entradas del archivo Superinteligencia Latam. Usa solo información presente en el informe; no inventes fechas ni URLs. Omite hallazgos sin URL concreta o que repitan entradas ya registradas.

Etapas del camino (asigna una solo si el hecho la demuestra claramente; un anuncio o un borrador no cuenta como ley aprobada):
${archivo.etapas.map((e) => `- ${e.id}: ${e.descripcion}`).join("\n")}`,
    messages: [{
      role: "user",
      content: `Ámbito: ${archivo.paises[codigo].nombre} (${codigo}).
Estado registrado: ${estado ? `${estado.nivel} — ${estado.resumen}` : "sin datos"}
Títulos ya registrados: ${archivo.entradas.filter((e) => e.pais === codigo).map((e) => e.titulo).join(" | ") || "(ninguno)"}

Informe:
${informe}`,
    }],
    output_config: { format: zodOutputFormat(esquemaHallazgos(archivo)) },
  });
  if (!respuesta.parsed_output) throw new Error("no se pudo interpretar el informe");
  return respuesta.parsed_output;
}

/* ---------- Fusión con el archivo ---------- */

export function normalizarURL(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    for (const k of [...u.searchParams.keys()]) if (k.startsWith("utm_")) u.searchParams.delete(k);
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function slug(texto) {
  const s = texto.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s.length <= 60 ? s : s.slice(0, 60).replace(/-[^-]*$/, "");
}

export function hashCorto(texto) {
  let h = 0x811c9dc5;
  for (const c of texto) h = Math.imul(h ^ c.codePointAt(0), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0").slice(0, 7);
}

export function fusionar(archivo, codigo, hallazgos, vistas, idActualizacion) {
  const urlsExistentes = new Set(archivo.entradas.flatMap((e) => e.fuentes.map((f) => normalizarURL(f.url))));
  const titulosExistentes = new Set(archivo.entradas.map((e) => slug(e.titulo)));
  const ids = new Set(archivo.entradas.map((e) => e.id));
  const nuevas = [];

  for (const h of hallazgos.entradas) {
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(h.fecha)) continue;
    const fuentes = h.fuentes
      .map((f) => ({ nombre: f.nombre, url: normalizarURL(f.url) }))
      .filter((f) => /^https?:\/\//.test(f.url) && vistas.has(f.url));
    if (!fuentes.length) continue;
    if (fuentes.some((f) => urlsExistentes.has(normalizarURL(f.url)))) continue;
    if (titulosExistentes.has(slug(h.titulo))) continue;

    let id = `${codigo === "regional" ? "regional" : archivo.paises[codigo].nombre}-${h.titulo}`;
    id = slug(id);
    while (ids.has(id)) id += "-" + hashCorto(id + Math.random());
    ids.add(id);
    fuentes.forEach((f) => urlsExistentes.add(normalizarURL(f.url)));

    const etapa = codigo !== "regional" && h.etapa !== "ninguna" ? h.etapa : null;
    const entrada = { id, fecha: h.fecha, pais: codigo, categoria: h.categoria, titulo: h.titulo,
      resumen: h.resumen, fuentes, etiquetas: h.etiquetas, etapa, actualizacion: idActualizacion };
    archivo.entradas.push(entrada);
    nuevas.push(entrada);
  }

  if (hallazgos.estado.cambio && codigo !== "regional") {
    archivo.estado_paises[codigo] = { nivel: hallazgos.estado.nivel, resumen: hallazgos.estado.resumen };
  }
  return nuevas;
}

/* ---------- Principal ---------- */

async function enParalelo(items, n, fn) {
  const resultados = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; resultados[k] = await fn(items[k]); }
  }));
  return resultados;
}

async function main() {
  const archivo = JSON.parse(await fs.readFile(ARCHIVO, "utf8"));
  const pedidos = (process.env.PAISES || "").split(",").map((s) => s.trim()).filter(Boolean);
  const codigos = pedidos.length ? pedidos.filter((c) => archivo.paises[c]) : Object.keys(archivo.paises);
  const fecha = new Date().toISOString();
  const idActualizacion = hashCorto(fecha);

  console.log(`Investigando ${codigos.length} ámbitos: ${codigos.join(", ")}`);
  const resultados = await enParalelo(codigos, CONCURRENCIA, async (codigo) => {
    try {
      const { informe, vistas } = await investigar(codigo, archivo);
      const hallazgos = await extraer(codigo, archivo, informe);
      return { codigo, hallazgos, vistas };
    } catch (error) {
      console.error(`✗ ${codigo}: ${error.message}`);
      return { codigo, error };
    }
  });

  // Se fusiona en orden fijo para que el resultado no dependa de qué país terminó primero.
  const nuevasPorPais = {};
  for (const r of resultados) {
    if (r.error) continue;
    const nuevas = fusionar(archivo, r.codigo, r.hallazgos, r.vistas, idActualizacion);
    if (nuevas.length) nuevasPorPais[r.codigo] = nuevas;
    console.log(`${nuevas.length ? "+" : "·"} ${r.codigo}: ${nuevas.length} noticias nuevas`);
  }

  const total = Object.values(nuevasPorPais).flat().length;
  const fallidos = resultados.filter((r) => r.error).map((r) => r.codigo);
  const nombres = Object.keys(nuevasPorPais).map((c) => archivo.paises[c].nombre).join(", ");
  const mensaje = total
    ? `${total} ${total === 1 ? "noticia nueva" : "noticias nuevas"} (${nombres})`
    : "Sin novedades";

  if (total) {
    archivo.actualizaciones.push({ id: idActualizacion, fecha, mensaje, paises: Object.keys(nuevasPorPais) });
    await fs.writeFile(ARCHIVO, JSON.stringify(archivo, null, 2) + "\n");
  }

  const detalle = Object.entries(nuevasPorPais)
    .flatMap(([c, es]) => es.map((e) => `- [${c}] ${e.fecha} ${e.titulo}`)).join("\n");
  const cuerpo = `${mensaje}\n\n${detalle}${fallidos.length ? `\n\nFallaron: ${fallidos.join(", ")}` : ""}\n`;
  console.log("\n" + cuerpo);
  if (process.env.MENSAJE_COMMIT) await fs.writeFile(process.env.MENSAJE_COMMIT, cuerpo);
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, "## " + cuerpo);
  if (fallidos.length === codigos.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
