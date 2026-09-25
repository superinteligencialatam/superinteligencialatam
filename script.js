/**
 * SUPERINTELIGENCIA LATAM — Grafo del archivo
 * Lee data/archivo.json y lo dibuja como un `git log --graph`:
 * cada país es una rama, cada hecho un nodo y cada fetch un merge.
 */

const $ = (sel) => document.querySelector(sel);
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
// Un color por rama, en el orden de `paises` en archivo.json.
const COLORES = ["#d2a8ff", "#58a6ff", "#7ee787", "#3fb950", "#ff7b72", "#e3b341", "#39c5cf", "#ffa657",
  "#a371f7", "#56d4dd", "#bb8009", "#f778ba", "#ff9492", "#79c0ff", "#f2cc60"];
const CARRIL = matchMedia("(max-width: 760px)").matches ? 10 : 14;  // separación entre carriles
const X0 = 9;               // posición del carril main

let A;                      // el archivo
const estado = { texto: "", pais: "", abierta: "" };

/* ---------- Utilidades ---------- */

function escapar(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatearFecha(f) {
  const [a, m, d] = f.slice(0, 10).split("-");
  return d ? `${String(Number(d)).padStart(2, " ")} ${MESES[m - 1]} ${a}` : `   ${MESES[m - 1]} ${a}`;
}

const sinAcentos = (t) => t.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
const colorPais = (c) => COLORES[Object.keys(A.paises).indexOf(c) % COLORES.length];
const nombrePais = (c) => A.paises[c]?.nombre ?? c;

/* ---------- Estado en la URL ---------- */

function leerURL() {
  const q = new URLSearchParams(location.search);
  estado.texto = q.get("q") || "";
  estado.pais = q.get("rama") || "";
  const h = location.hash.slice(1);
  estado.abierta = h && h !== "readme" ? h : "";
}

function escribirURL() {
  const q = new URLSearchParams();
  if (estado.texto) q.set("q", estado.texto);
  if (estado.pais) q.set("rama", estado.pais);
  const s = q.toString();
  const hash = location.hash === "#readme" ? "#readme" : estado.abierta ? "#" + estado.abierta : "";
  history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + hash);
}

/* ---------- Lateral ---------- */

function renderRamas() {
  const cuenta = (c) => A.entradas.filter((e) => e.pais === c).length;
  const items = [["", "main", A.entradas.length, "var(--dim)"],
    ...Object.keys(A.paises).map((c) => [c, c === "regional" ? c : `${c} ${nombrePais(c).toLowerCase()}`, cuenta(c), colorPais(c)])];
  $("#ramas").innerHTML = items.map(([c, nombre, n, color]) => `
    <li><button class="rama" data-pais="${c}" aria-current="${estado.pais === c}">
      <span class="marca">${estado.pais === c ? "*" : ""}</span>
      <span class="color" style="background:${color}"></span>
      <span class="nombre">${escapar(nombre)}</span>
      <span class="n">${n}</span>
    </button></li>`).join("");
  $("#rama-actual").textContent = estado.pais || "main";
}

function renderFetches() {
  const runs = [...A.actualizaciones].reverse();
  $("#fetches").innerHTML = runs.map((r) => {
    const n = A.entradas.filter((e) => e.actualizacion === r.id).length;
    return `<li><span class="h">●</span><span>${formatearFecha(r.fecha).trim()} · +${n}</span><span class="m">${escapar(r.mensaje)}</span></li>`;
  }).join("");
}

function renderInfoRama() {
  const caja = $("#info-rama");
  if (!estado.pais || estado.pais === "regional") { caja.hidden = true; return; }
  const info = A.estado_paises[estado.pais] || { nivel: "sin-datos", resumen: "Pendiente de documentar." };
  caja.hidden = false;
  caja.style.setProperty("--c", colorPais(estado.pais));
  caja.innerHTML = `<b>${escapar(nombrePais(estado.pais))}</b><span class="nivel ${info.nivel}">${escapar(A.niveles[info.nivel])}</span>
    <p>${escapar(info.resumen)}</p>`;
}

/* ---------- Grafo ---------- */

function coincide(e) {
  if (estado.pais && e.pais !== estado.pais) return false;
  if (estado.texto) {
    const pajar = sinAcentos([e.titulo, e.resumen, nombrePais(e.pais), e.pais, A.categorias[e.categoria], ...(e.etiquetas || [])].join(" "));
    if (!pajar.includes(sinAcentos(estado.texto))) return false;
  }
  return true;
}

// Filas en orden de log: el fetch más reciente arriba, y bajo cada merge sus nodos por fecha.
function construirFilas() {
  const filas = [];
  for (const run of [...A.actualizaciones].reverse()) {
    const nodos = A.entradas.filter((e) => e.actualizacion === run.id && coincide(e))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    if (!nodos.length) continue;
    filas.push({ tipo: "merge", run, paises: [...new Set(nodos.map((e) => e.pais))], n: nodos.length });
    for (const e of nodos) filas.push({ tipo: "nodo", e });
  }
  return filas;
}

function calcularCarriles(filas) {
  const orden = Object.keys(A.paises);
  const presentes = [...new Set(filas.filter((f) => f.tipo === "nodo").map((f) => f.e.pais))]
    .sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
  const carriles = {};
  presentes.forEach((c, i) => {
    const primera = filas.findIndex((f) => (f.tipo === "merge" ? f.paises.includes(c) : f.e.pais === c));
    const ultima = filas.findLastIndex((f) => f.tipo === "nodo" && f.e.pais === c);
    carriles[c] = { x: X0 + (i + 1) * CARRIL, color: colorPais(c), primera, ultima };
  });
  return { carriles, ancho: X0 + (presentes.length + 1) * CARRIL };
}

function lineasFila(i, filas, carriles) {
  let html = "";
  const fila = filas[i];
  // main: del primer merge a la última fila
  const clsMain = i === 0 ? "desde-medio" : "";
  html += `<span class="linea ${clsMain}" style="left:${X0}px;background:var(--tenue)"></span>`;

  for (const [c, k] of Object.entries(carriles)) {
    if (i < k.primera || i > k.ultima) continue;
    const empiezaAqui = i === k.primera;
    if (fila.tipo === "merge" && fila.paises.includes(c) && empiezaAqui) {
      html += `<span class="linea" style="left:${k.x}px;top:20px;background:${k.color}"></span>`;
      continue;
    }
    let cls = "";
    if (empiezaAqui && i === k.ultima) continue;
    if (empiezaAqui) cls = "desde-medio";
    else if (i === k.ultima) cls = "hasta-medio";
    html += `<span class="linea ${cls}" style="left:${k.x}px;background:${k.color}"></span>`;
  }

  if (fila.tipo === "merge") {
    const curvas = fila.paises.map((c) => {
      const x = carriles[c].x;
      return `<path d="M${X0} 14 H${x - 6} Q${x} 14 ${x} 20" stroke="${carriles[c].color}" stroke-width="2" fill="none"/>`;
    }).join("");
    html += `<svg class="curva" width="1" height="1">${curvas}</svg>`;
    html += `<span class="merge" style="left:${X0}px;--c:var(--verde)"></span>`;
  } else {
    html += `<span class="nodo" style="left:${carriles[fila.e.pais].x}px"></span>`;
  }
  return html;
}

function renderMerge(f, esHead) {
  const r = f.run;
  const ramas = f.paises.map((c) => `<span style="color:${colorPais(c)}">${c}</span>`).join(", ");
  return `
    <div class="cabecera" style="cursor:default">
      ${esHead ? `<span class="deco"><span class="t">(</span><span class="r" style="--c:var(--azul)">HEAD → main</span><span class="t">)</span></span>` : ""}
      <span class="titulo"><b>Merge ${escapar(r.mensaje)}</b> <span class="dim">· +${f.n} en ${ramas}</span></span>
      <span class="fecha">${formatearFecha(r.fecha)}</span>
    </div>`;
}

function renderNodo(e) {
  const abierta = estado.abierta === e.id;
  const color = colorPais(e.pais);
  const show = abierta ? `
    <div class="show">
      <dl class="show-meta">
        <dt>rama</dt><dd><span style="color:${color}">${e.pais}</span> · ${escapar(nombrePais(e.pais))}</dd>
        <dt>fecha</dt><dd>${formatearFecha(e.fecha).trim()}</dd>
        <dt>tipo</dt><dd>${escapar(A.categorias[e.categoria] || e.categoria)}</dd>
      </dl>
      <div class="show-cuerpo">${e.resumen.split(/\n\n+/).map((p) => `<p>${escapar(p)}</p>`).join("")}</div>
      <div class="show-pie">
        ${e.fuentes.map((f) => `<a href="${escapar(f.url)}" target="_blank" rel="noopener">↗ ${escapar(f.nombre)}</a>`).join("")}
      </div>
    </div>` : "";
  return `
    <button class="cabecera" data-id="${escapar(e.id)}" aria-expanded="${abierta}">
      <span class="deco"><span class="t">(</span><span class="r" style="--c:${color}">${e.pais}</span><span class="t">)</span></span>
      <span class="titulo">${escapar(e.titulo)}</span>
      <span class="fecha">${formatearFecha(e.fecha)}</span>
    </button>${show}`;
}

function renderLog() {
  const filas = construirFilas();
  const total = filas.filter((f) => f.tipo === "nodo").length;
  const filtrando = estado.texto || estado.pais;
  $("#resultado").textContent = filtrando
    ? `${total} de ${A.entradas.length} nodos`
    : `${A.entradas.length} nodos · ${Object.keys(A.paises).length} ramas · ${A.actualizaciones.length} fetch`;

  if (!filas.length) {
    $("#log").innerHTML = `<li class="vacio">fatal: ningún nodo coincide con estos filtros.</li>`;
    return;
  }
  const { carriles, ancho } = calcularCarriles(filas);
  let primerMerge = true;
  $("#log").innerHTML = filas.map((f, i) => {
    const esMerge = f.tipo === "merge";
    const cuerpo = esMerge ? renderMerge(f, primerMerge) : renderNodo(f.e);
    if (esMerge) primerMerge = false;
    const clase = esMerge ? "fila fila-merge" : `fila${estado.abierta === f.e.id ? " abierta" : ""}`;
    const color = esMerge ? "" : ` style="--c:${colorPais(f.e.pais)}"`;
    return `<li class="${clase}"${color}${esMerge ? "" : ` id="${escapar(f.e.id)}"`}>
      <div class="grafo" style="width:${ancho}px">${lineasFila(i, filas, carriles)}</div>
      <div class="contenido">${cuerpo}</div>
    </li>`;
  }).join("");
}

function render() {
  escribirURL();
  renderRamas();
  renderFetches();
  renderInfoRama();
  renderLog();
}

/* ---------- README y fetch ---------- */

function mostrarReadme(visible) {
  $("#readme").hidden = !visible;
  $("#log").hidden = visible;
  $("#resultado").hidden = visible;
  $("#info-rama").hidden = visible || !estado.pais || estado.pais === "regional";
}

function abrirFetch() {
  const codigos = Object.keys(A.paises);
  $("#n-paises").textContent = codigos.length;
  $("#lista-paises").innerHTML = codigos.map((c) => `<span style="--c:${colorPais(c)}">${c}</span>`).join("");
  const ultima = A.actualizaciones.at(-1);
  $("#ultimo-fetch").textContent = `Último fetch: ${formatearFecha(ultima.fecha).trim()}.`;
  $("#dialogo-fetch").showModal();
}

/* ---------- Inicio ---------- */

function eventos() {
  const buscar = $("#buscar");
  buscar.value = estado.texto;
  buscar.addEventListener("input", () => { estado.texto = buscar.value; render(); });

  $("#ramas").addEventListener("click", (ev) => {
    const b = ev.target.closest(".rama");
    if (!b) return;
    estado.pais = b.dataset.pais;
    if (location.hash === "#readme") history.replaceState(null, "", location.pathname + location.search);
    mostrarReadme(false);
    render();
  });

  $("#log").addEventListener("click", (ev) => {
    const b = ev.target.closest("button.cabecera");
    if (!b) return;
    estado.abierta = estado.abierta === b.dataset.id ? "" : b.dataset.id;
    render();
  });

  $("#ver-readme").addEventListener("click", (ev) => { ev.preventDefault(); location.hash = "readme"; });
  $("#cerrar-readme").addEventListener("click", () => { history.replaceState(null, "", location.pathname + location.search); mostrarReadme(false); });
  window.addEventListener("hashchange", () => {
    mostrarReadme(location.hash === "#readme");
    if (location.hash !== "#readme") { leerURL(); render(); }
  });

  $("#fetch").addEventListener("click", abrirFetch);
}

async function iniciar() {
  try {
    const r = await fetch("data/archivo.json", { cache: "no-cache" });
    A = await r.json();
  } catch {
    $("#log").innerHTML = `<li class="vacio">error: no se pudo leer data/archivo.json</li>`;
    return;
  }
  leerURL();
  eventos();
  render();
  mostrarReadme(location.hash === "#readme");
  if (estado.abierta) document.getElementById(estado.abierta)?.scrollIntoView({ block: "center" });
}

iniciar();
