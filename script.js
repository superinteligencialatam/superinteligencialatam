/**
 * SUPERINTELIGENCIA LATAM — El camino a la singularidad
 * Lee data/archivo.json y dibuja:
 *   1. El camino: una fila horizontal por país con sus seis etapas.
 *   2. La línea de tiempo: todas las noticias, de la más reciente a la más antigua.
 */

const $ = (sel) => document.querySelector(sel);
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
// Un color por país, en el orden de `paises` en archivo.json.
const COLORES = ["#d2a8ff", "#58a6ff", "#7ee787", "#3fb950", "#ff7b72", "#e3b341", "#39c5cf", "#ffa657",
  "#a371f7", "#56d4dd", "#bb8009", "#f778ba", "#ff9492", "#79c0ff", "#f2cc60"];

let A;                      // el archivo
const estado = { texto: "", pais: "", etapa: "", abierta: "" };

/* ---------- Utilidades ---------- */

function escapar(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatearFecha(f, largo = false) {
  const [a, m, d] = f.slice(0, 10).split("-");
  const mes = (largo ? MESES_LARGOS : MESES)[m - 1];
  if (!d) return `${mes} ${a}`;
  return largo ? `${Number(d)} de ${mes} de ${a}` : `${Number(d)} ${mes} ${a}`;
}

const sinAcentos = (t) => t.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
const colorPais = (c) => COLORES[Object.keys(A.paises).indexOf(c) % COLORES.length];
const nombrePais = (c) => A.paises[c]?.nombre ?? c;
const etapa = (id) => A.etapas.find((e) => e.id === id);
const paisesDelCamino = () => Object.keys(A.paises).filter((c) => c !== "regional");

/* ---------- Progreso de cada país ---------- */

// Etapas alcanzadas: las que tienen noticias, más las que otra implica (una ley implica un proyecto).
function progreso(c) {
  const noticias = A.entradas.filter((e) => e.pais === c && e.etapa);
  const directas = new Set(noticias.map((e) => e.etapa));
  const implicitas = new Set();
  for (const id of directas) for (const i of etapa(id)?.implica || []) if (!directas.has(i)) implicitas.add(i);
  const alcanzadas = directas.size + implicitas.size;
  return { noticias, directas, implicitas, alcanzadas, faltan: A.etapas.length - alcanzadas };
}

/* ---------- Estado en la URL ---------- */

function leerURL() {
  const q = new URLSearchParams(location.search);
  estado.texto = q.get("q") || "";
  estado.pais = A.paises[q.get("pais")] ? q.get("pais") : "";
  estado.etapa = etapa(q.get("etapa")) ? q.get("etapa") : "";
  const h = location.hash.slice(1);
  estado.abierta = h && h !== "como-funciona" ? h : "";
}

function escribirURL() {
  const q = new URLSearchParams();
  if (estado.texto) q.set("q", estado.texto);
  if (estado.pais) q.set("pais", estado.pais);
  if (estado.etapa) q.set("etapa", estado.etapa);
  const s = q.toString();
  const hash = estado.abierta ? "#" + estado.abierta : location.hash === "#como-funciona" ? "#como-funciona" : "";
  history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + hash);
}

/* ---------- El camino ---------- */

function renderCamino() {
  const n = A.etapas.length;
  const filas = paisesDelCamino()
    .map((c) => ({ c, p: progreso(c) }))
    .sort((a, b) => b.p.alcanzadas - a.p.alcanzadas || b.p.noticias.length - a.p.noticias.length
      || nombrePais(a.c).localeCompare(nombrePais(b.c), "es"));

  const cabecera = `
    <div class="fila-camino cab-camino" aria-hidden="true">
      <span></span>
      <div class="pista-etapas">
        ${A.etapas.map((e, i) => `<span class="etq-etapa" style="left:${((i + 0.5) / (n + 1)) * 100}%" title="${escapar(e.descripcion)}"><b>${i + 1}</b>${escapar(e.nombre)}</span>`).join("")}
        <span class="etq-etapa etq-singularidad" style="left:${((n + 0.5) / (n + 1)) * 100}%">Singularidad</span>
      </div>
      <span class="etq-distancia">Etapas</span>
    </div>`;

  const vacios = filas.filter((f) => !f.p.alcanzadas).map((f) => f.c);
  const cuerpo = filas.filter((f) => f.p.alcanzadas).map(({ c, p }) => {
    const color = colorPais(c);
    const mas = A.etapas.reduce((m, e, i) => (p.directas.has(e.id) || p.implicitas.has(e.id) ? i : m), -1);
    const avance = mas < 0 ? 0 : ((mas + 0.5) / (n + 1)) * 100;
    const nodos = A.etapas.map((e, i) => {
      const x = ((i + 0.5) / (n + 1)) * 100;
      const cuantas = p.noticias.filter((y) => y.etapa === e.id).length;
      let clase = "pendiente", titulo = `${e.nombre}: todavía no`;
      if (p.directas.has(e.id)) { clase = "alcanzada"; titulo = `${e.nombre}: ${cuantas} ${cuantas === 1 ? "noticia" : "noticias"}`; }
      else if (p.implicitas.has(e.id)) { clase = "implicita"; titulo = `${e.nombre}: cumplida al aprobarse la ley`; }
      const activo = estado.pais === c && estado.etapa === e.id ? " activo" : "";
      return `<button type="button" class="punto ${clase}${activo}" style="left:${x}%" data-pais="${c}" data-etapa="${e.id}"
        title="${escapar(titulo)}" aria-label="${escapar(nombrePais(c))}. ${escapar(titulo)}" ${clase === "pendiente" ? "disabled" : ""}>${cuantas > 1 ? `<span class="cuenta">${cuantas}</span>` : ""}</button>`;
    }).join("");
    const distancia = p.alcanzadas
      ? `<b>${p.alcanzadas}</b><span class="dim">/${n}</span><small>${p.faltan ? `faltan ${p.faltan}` : "todas"}</small>`
      : `<small class="dim">sin datos</small>`;
    return `
      <div class="fila-camino${p.alcanzadas ? "" : " vacia"}${estado.pais === c ? " elegida" : ""}" style="--c:${color}">
        <button type="button" class="pais-nombre" data-pais="${c}"><i></i>${escapar(nombrePais(c))}</button>
        <div class="pista-etapas">
          <span class="riel"></span>
          <span class="avance" style="width:${avance}%"></span>
          ${nodos}
          <span class="meta" style="left:${((n + 0.5) / (n + 1)) * 100}%" aria-hidden="true">✦</span>
        </div>
        <div class="distancia">${distancia}</div>
      </div>`;
  }).join("");

  const pendientes = vacios.length ? `
    <p class="sin-datos">Sin datos todavía:
      ${vacios.map((c) => `<button type="button" class="pais-nombre pais-mini" data-pais="${c}" style="--c:${colorPais(c)}"><i></i>${escapar(nombrePais(c))}</button>`).join("")}
    </p>` : "";
  $("#pista").innerHTML = `<div class="pista-interior">${cabecera}${cuerpo}</div>${pendientes}`;
}

/* ---------- Línea de tiempo ---------- */

function coincide(e) {
  if (estado.pais && e.pais !== estado.pais) return false;
  if (estado.etapa) {
    // Filtrar por una etapa implícita muestra las noticias que la implican.
    const implican = A.etapas.filter((x) => (x.implica || []).includes(estado.etapa)).map((x) => x.id);
    if (e.etapa !== estado.etapa && !implican.includes(e.etapa)) return false;
  }
  if (estado.texto) {
    const pajar = sinAcentos([e.titulo, e.resumen, nombrePais(e.pais), etapa(e.etapa)?.nombre || "", ...(e.etiquetas || [])].join(" "));
    if (!pajar.includes(sinAcentos(estado.texto))) return false;
  }
  return true;
}

function renderInfoPais() {
  const caja = $("#info-pais");
  if (!estado.pais || estado.pais === "regional") { caja.hidden = true; return; }
  const info = A.estado_paises[estado.pais];
  const p = progreso(estado.pais);
  caja.hidden = false;
  caja.style.setProperty("--c", colorPais(estado.pais));
  caja.innerHTML = `
    <b>${escapar(nombrePais(estado.pais))}</b>
    <span class="dim">· ${p.alcanzadas} de ${A.etapas.length} etapas</span>
    ${info ? `<p>${escapar(info.resumen)}</p>` : `<p class="dim">Todavía no hay información sobre este país. Aparecerá en la próxima búsqueda de novedades.</p>`}`;
}

function renderFiltro() {
  const b = $("#quitar-filtro");
  const partes = [estado.pais && nombrePais(estado.pais), estado.etapa && etapa(estado.etapa).nombre].filter(Boolean);
  b.hidden = !partes.length;
  b.textContent = partes.join(" · ") + "  ×";
  b.title = "Ver todos los países";
}

function renderNoticia(e) {
  const abierta = estado.abierta === e.id;
  const color = colorPais(e.pais);
  const et = etapa(e.etapa);
  const detalle = abierta ? `
    <div class="detalle">
      ${e.resumen.split(/\n\n+/).map((p) => `<p>${escapar(p)}</p>`).join("")}
      <div class="detalle-pie">
        <span class="fuentes">${e.fuentes.map((f) => `<a href="${escapar(f.url)}" target="_blank" rel="noopener">${escapar(f.nombre)} ↗</a>`).join("")}</span>
        <span class="acciones">
          <button type="button" class="accion" data-accion="enlace" data-id="${escapar(e.id)}">Copiar enlace</button>
          <button type="button" class="accion" data-accion="citar" data-id="${escapar(e.id)}">Citar</button>
        </span>
      </div>
    </div>` : "";
  return `
    <li class="noticia${abierta ? " abierta" : ""}" id="${escapar(e.id)}" style="--c:${color}">
      <button type="button" class="noticia-cab" data-id="${escapar(e.id)}" aria-expanded="${abierta}">
        <time datetime="${e.fecha}">${formatearFecha(e.fecha)}</time>
        <span class="noticia-pais"><i></i>${escapar(nombrePais(e.pais))}</span>
        <span class="noticia-titulo">${escapar(e.titulo)}</span>
        ${et ? `<span class="noticia-etapa">${escapar(et.nombre)}</span>` : ""}
      </button>${detalle}
    </li>`;
}

function renderLista() {
  const lista = A.entradas.filter(coincide).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const filtrando = estado.texto || estado.pais || estado.etapa;
  $("#resultado").textContent = filtrando ? `${lista.length} de ${A.entradas.length} noticias` : "";
  if (!lista.length) {
    $("#lista").innerHTML = `<li class="vacio">No hay noticias con estos filtros todavía.</li>`;
    return;
  }
  let html = "", anio = null;
  for (const e of lista) {
    const a = e.fecha.slice(0, 4);
    if (a !== anio) { html += `<li class="anio">${a}</li>`; anio = a; }
    html += renderNoticia(e);
  }
  $("#lista").innerHTML = html;
}

function renderPie() {
  const u = A.actualizaciones.at(-1);
  $("#ultima").textContent = `${A.entradas.length} noticias · actualizado el ${formatearFecha(u.fecha, true)}`;
}

function render() {
  escribirURL();
  renderCamino();
  renderInfoPais();
  renderFiltro();
  renderLista();
  renderPie();
}

/* ---------- Enlace y cita de una noticia ---------- */

const enlaceNoticia = (id) => `${location.origin}${location.pathname}#${id}`;

function citaNoticia(e) {
  return `Superinteligencia Latam. (${formatearFecha(e.fecha, true)}). ${e.titulo} [${nombrePais(e.pais)}]. ${enlaceNoticia(e.id)}`;
}

async function copiar(boton, texto) {
  const original = boton.textContent;
  try {
    await navigator.clipboard.writeText(texto);
    boton.textContent = "✓ Copiado";
  } catch {
    prompt("Copia el texto:", texto);
  }
  setTimeout(() => { boton.textContent = original; }, 1500);
}

/* ---------- Paneles ---------- */

function mostrarComo(visible) {
  $("#como-funciona").hidden = !visible;
  if (visible) $("#como-funciona").scrollIntoView({ behavior: "smooth", block: "start" });
}

function irALista() {
  $("#t-noticias").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- Inicio ---------- */

function eventos() {
  const buscar = $("#buscar");
  buscar.value = estado.texto;
  buscar.addEventListener("input", () => { estado.texto = buscar.value; render(); });

  $("#pista").addEventListener("click", (ev) => {
    const punto = ev.target.closest(".punto");
    const nombre = ev.target.closest(".pais-nombre");
    if (punto) {
      const mismo = estado.pais === punto.dataset.pais && estado.etapa === punto.dataset.etapa;
      estado.pais = mismo ? "" : punto.dataset.pais;
      estado.etapa = mismo ? "" : punto.dataset.etapa;
    } else if (nombre) {
      estado.pais = estado.pais === nombre.dataset.pais && !estado.etapa ? "" : nombre.dataset.pais;
      estado.etapa = "";
    } else return;
    estado.abierta = "";
    render();
    if (estado.pais) irALista();
  });

  $("#quitar-filtro").addEventListener("click", () => { estado.pais = ""; estado.etapa = ""; render(); });

  $("#lista").addEventListener("click", (ev) => {
    const accion = ev.target.closest("[data-accion]");
    if (accion) {
      const e = A.entradas.find((x) => x.id === accion.dataset.id);
      copiar(accion, accion.dataset.accion === "citar" ? citaNoticia(e) : enlaceNoticia(e.id));
      return;
    }
    const b = ev.target.closest(".noticia-cab");
    if (!b) return;
    estado.abierta = estado.abierta === b.dataset.id ? "" : b.dataset.id;
    render();
  });

  $("#ver-como").addEventListener("click", (ev) => { ev.preventDefault(); mostrarComo(true); });
  $("#cerrar-como").addEventListener("click", () => mostrarComo(false));
}

async function iniciar() {
  try {
    const r = await fetch("data/archivo.json", { cache: "no-cache" });
    A = await r.json();
  } catch {
    $("#pista").innerHTML = `<p class="vacio">No se pudo cargar el archivo. Recarga la página.</p>`;
    return;
  }
  leerURL();
  // El país que el visitante eligió seguir en la bienvenida es su vista por defecto.
  if (!estado.pais && !location.search) {
    try { const p = localStorage.getItem("sil.pais"); if (A.paises[p]) estado.pais = p; } catch {}
  }
  $("#etapas-lista").innerHTML = A.etapas.map((e) => `<li><b>${escapar(e.nombre)}.</b> ${escapar(e.descripcion)}</li>`).join("");
  eventos();
  render();
  mostrarComo(location.hash === "#como-funciona");
  if (estado.abierta) document.getElementById(estado.abierta)?.scrollIntoView({ block: "center" });
}

// bienvenida.js espera a que el archivo esté cargado.
const listo = iniciar();
