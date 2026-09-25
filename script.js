/**
 * SUPERINTELIGENCIA LATAM — Renderizado del archivo
 * Lee PAISES, CATEGORIAS, ESTADO_PAISES y ENTRADAS de data/entradas.js
 */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const NIVELES = {
  "ley":        "Ley vigente",
  "tramite":    "Proyecto en trámite",
  "estrategia": "Solo estrategia / política",
  "sin-datos":  "Por documentar",
};

const $ = (sel) => document.querySelector(sel);

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// "2024-12-10" → "10 dic 2024"; "2024-07" → "jul 2024"
function formatearFecha(fecha) {
  const [a, m, d] = fecha.split("-");
  const mes = MESES[Number(m) - 1];
  return d ? `${Number(d)} ${mes} ${a}` : `${mes} ${a}`;
}

function nombrePais(codigo) {
  const p = PAISES[codigo];
  return p ? `${p.bandera} ${p.nombre}` : codigo;
}

const entradasOrdenadas = [...ENTRADAS].sort((a, b) => b.fecha.localeCompare(a.fecha));

/* ---------- Cabecera ---------- */

function iniciarCabecera() {
  const hoy = new Date();
  $("#hoy").textContent = hoy.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const actual = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("activo", a.dataset.nav === actual));
}

/* ---------- Noticias ---------- */

const estado = { texto: "", pais: "", categoria: "" };

function leerURL() {
  const q = new URLSearchParams(location.search);
  estado.texto = q.get("q") || "";
  estado.pais = q.get("pais") || "";
  estado.categoria = q.get("cat") || "";
}

function escribirURL() {
  const q = new URLSearchParams();
  if (estado.texto) q.set("q", estado.texto);
  if (estado.pais) q.set("pais", estado.pais);
  if (estado.categoria) q.set("cat", estado.categoria);
  const s = q.toString();
  history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash);
}

function renderStats() {
  const paises = new Set(ENTRADAS.map((e) => e.pais).filter((p) => p !== "regional"));
  const regulacion = ENTRADAS.filter((e) => e.categoria === "regulacion").length;
  const ultima = entradasOrdenadas[0];
  $("#stats").innerHTML = `
    <div class="stat"><b>${ENTRADAS.length}</b><span>entradas en el archivo</span></div>
    <div class="stat"><b>${paises.size}</b><span>países con registros</span></div>
    <div class="stat"><b>${regulacion}</b><span>hitos regulatorios</span></div>
    <div class="stat"><b class="mono" style="font-size:1rem;padding-top:.7rem">${ultima ? formatearFecha(ultima.fecha) : "—"}</b><span>entrada más reciente</span></div>`;
}

function renderFiltros() {
  const usados = new Set(ENTRADAS.map((e) => e.pais));
  const opciones = Object.entries(PAISES)
    .filter(([c]) => usados.has(c))
    .sort(([a, pa], [b, pb]) => (a === "regional" ? -1 : b === "regional" ? 1 : pa.nombre.localeCompare(pb.nombre, "es")));
  const select = $("#filtro-pais");
  select.innerHTML = `<option value="">Todos los países</option>` +
    opciones.map(([c]) => `<option value="${c}">${nombrePais(c)}</option>`).join("");
  select.value = estado.pais;

  const chips = $("#filtro-categoria");
  chips.innerHTML = [["", "Todo"], ...Object.entries(CATEGORIAS)]
    .map(([c, n]) => `<button class="chip" data-cat="${c}" aria-pressed="${estado.categoria === c}">${n}</button>`).join("");

  $("#buscar").value = estado.texto;

  $("#buscar").addEventListener("input", (e) => { estado.texto = e.target.value; actualizar(); });
  select.addEventListener("change", (e) => { estado.pais = e.target.value; actualizar(); });
  chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    estado.categoria = b.dataset.cat;
    chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
    actualizar();
  });
}

function coincide(e) {
  if (estado.pais && e.pais !== estado.pais) return false;
  if (estado.categoria && e.categoria !== estado.categoria) return false;
  if (estado.texto) {
    const t = estado.texto.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const pajar = [e.titulo, e.resumen, nombrePais(e.pais), CATEGORIAS[e.categoria], ...(e.etiquetas || [])]
      .join(" ").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    if (!pajar.includes(t)) return false;
  }
  return true;
}

function renderEntrada(e) {
  const parrafos = e.resumen.split(/\n\n+/).map((p) => `<p>${escapar(p)}</p>`).join("");
  const fuentes = (e.fuentes || [])
    .map((f) => `<a href="${escapar(f.url)}" target="_blank" rel="noopener">↗ ${escapar(f.nombre)}</a>`).join("");
  const etiquetas = (e.etiquetas || []).map((t) => `#${escapar(t)}`).join(" ");
  return `
    <article class="entrada" id="${escapar(e.id)}">
      <time class="entrada-fecha mono" datetime="${e.fecha}">${formatearFecha(e.fecha)}</time>
      <div>
        <div class="meta">
          <span class="tag-cat">${CATEGORIAS[e.categoria] || e.categoria}</span>
          <a class="tag-pais" href="?pais=${e.pais}">${nombrePais(e.pais)}</a>
        </div>
        <h2><a href="#${escapar(e.id)}">${escapar(e.titulo)}</a></h2>
        <div class="resumen">${parrafos}</div>
        <div class="fuentes mono">${fuentes}${etiquetas ? `<span class="etiquetas">${etiquetas}</span>` : ""}</div>
      </div>
    </article>`;
}

function actualizar() {
  escribirURL();
  const lista = entradasOrdenadas.filter(coincide);
  const filtrando = estado.texto || estado.pais || estado.categoria;
  $("#resultado").textContent = filtrando
    ? `${lista.length} de ${ENTRADAS.length} entradas`
    : "";

  if (!lista.length) {
    $("#feed").innerHTML = `<p class="vacio">No hay entradas que coincidan con estos filtros.</p>`;
    return;
  }
  let html = "", anio = null;
  for (const e of lista) {
    const a = e.fecha.slice(0, 4);
    if (a !== anio) { html += `<h2 class="anio">${a}</h2>`; anio = a; }
    html += renderEntrada(e);
  }
  $("#feed").innerHTML = html;
}

function iniciarNoticias() {
  leerURL();
  renderStats();
  renderFiltros();
  actualizar();
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

/* ---------- Países ---------- */

function iniciarPaises() {
  $("#leyenda").innerHTML = Object.entries(NIVELES)
    .map(([k, n]) => `<span><i class="punto ${k}"></i>${n}</span>`).join("");

  const orden = { ley: 0, tramite: 1, estrategia: 2, "sin-datos": 3 };
  const codigos = Object.keys(PAISES).filter((c) => c !== "regional" && (ESTADO_PAISES[c] || ENTRADAS.some((e) => e.pais === c)));
  codigos.sort((a, b) =>
    orden[(ESTADO_PAISES[a] || {}).nivel || "sin-datos"] - orden[(ESTADO_PAISES[b] || {}).nivel || "sin-datos"] ||
    PAISES[a].nombre.localeCompare(PAISES[b].nombre, "es"));

  $("#paises").innerHTML = codigos.map((c) => {
    const info = ESTADO_PAISES[c] || { nivel: "sin-datos", resumen: "Pendiente de documentar." };
    const n = ENTRADAS.filter((e) => e.pais === c).length;
    return `
      <a class="pais" href="index.html?pais=${c}">
        <h3>${nombrePais(c)}</h3>
        <span class="estado mono"><i class="punto ${info.nivel}"></i>${NIVELES[info.nivel]}</span>
        <p>${escapar(info.resumen)}</p>
        <span class="cuenta mono">${n} ${n === 1 ? "entrada" : "entradas"} →</span>
      </a>`;
  }).join("");
}

/* ---------- Inicio ---------- */

iniciarCabecera();
if (document.body.dataset.page === "noticias") iniciarNoticias();
if (document.body.dataset.page === "paises") iniciarPaises();
