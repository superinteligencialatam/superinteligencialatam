/**
 * SUPERINTELIGENCIA LATAM — Bienvenida y avisos
 *
 * 1. Primera visita: un flujo de tres pasos (qué es el sitio y qué país
 *    seguir → suscripción por correo → canal de YouTube).
 * 2. Visitas siguientes: un aviso discreto para quien aún no se suscribió.
 *
 * Un paso sin configurar se omite solo. Rellena CONFIG para activarlo.
 */

const CONFIG = {
  boletin: {
    // Mientras no haya un servicio de boletín, el paso invita a escribir a este correo.
    correo: "binocuindiesoftware@gmail.com",
    // Si más adelante se usa un proveedor (Buttondown, Mailchimp, Brevo…), su URL
    // de suscripción va aquí y el paso muestra un formulario en lugar del correo.
    accion: "",
    campo: "email",          // nombre del campo de correo que espera el proveedor
  },
  youtube: {
    url: "https://www.youtube.com/@historicoia",
    nombre: "Histórico IA",
  },
  // Cuántos días esperar antes de volver a mostrar un aviso cerrado.
  diasEntreAvisos: 14,
};

/* ---------- Almacenamiento (falla en silencio en modo privado) ---------- */

const memoria = {
  leer(k) { try { return localStorage.getItem("sil." + k); } catch { return null; } },
  guardar(k, v) { try { localStorage.setItem("sil." + k, v); } catch {} },
};

const hayFormulario = () => Boolean(CONFIG.boletin.accion);
const hayBoletin = () => hayFormulario() || Boolean(CONFIG.boletin.correo);

// Correo ya redactado para quien quiere recibir avisos.
function enlaceCorreo() {
  const quien = paisElegido ? nombrePais(paisElegido) : "América Latina";
  const asunto = `Quiero recibir avisos de ${quien}`;
  const cuerpo = `Hola, me gustaría recibir un aviso cuando ${paisElegido ? nombrePais(paisElegido) : "algún país"} avance en el camino hacia la singularidad.\n\nGracias.`;
  return `mailto:${CONFIG.boletin.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
const hayYoutube = () => Boolean(CONFIG.youtube.url);
const urlSuscripcionYoutube = () =>
  CONFIG.youtube.url + (CONFIG.youtube.url.includes("?") ? "&" : "?") + "sub_confirmation=1";

/* ---------- Flujo de bienvenida ---------- */

let pasos = [];
let paso = 0;
let paisElegido = "";

function pasosActivos() {
  return ["inicio", hayBoletin() && "correo", hayYoutube() && "youtube"].filter(Boolean);
}

function htmlInicio() {
  const chips = [["", "Toda la región"], ...Object.keys(A.paises).filter((c) => c !== "regional").map((c) => [c, nombrePais(c)])]
    .map(([c, n]) => `<button type="button" class="chip-rama" data-rama="${c}" aria-pressed="${paisElegido === c}"
      style="--c:${c ? colorPais(c) : "var(--dim)"}"><i></i>${escapar(n)}</button>`).join("");
  return `
    <h2>El camino de América Latina hacia la singularidad</h2>
    <p class="dim">Las leyes, estrategias e inversiones en inteligencia artificial de toda la región, en un solo lugar y con su fuente oficial.</p>
    <ul class="usos">
      <li><b>Mira qué tan lejos está cada país.</b> Seis etapas, de la primera estrategia nacional a los modelos de IA propios.</li>
      <li><b>Úsalo como referencia.</b> Cada noticia tiene enlace permanente y una cita lista para copiar.</li>
      <li><b>Ve a la fuente.</b> Todo hecho enlaza al documento oficial.</li>
    </ul>
    <p class="pregunta">¿Qué país te interesa más?</p>
    <div class="chips-rama">${chips}</div>`;
}

function htmlCorreo() {
  const quien = paisElegido ? escapar(nombrePais(paisElegido)) : "un país";
  if (!hayFormulario()) {
    return `
    <h2>Entérate cuando ${quien} avance</h2>
    <p class="dim">Escríbenos y te avisamos cuando ${quien} dé un paso en el camino: una ley nueva, una estrategia o una inversión, con el enlace a la fuente.</p>
    <div class="correo-directo">
      <a class="btn btn-primario" href="${escapar(enlaceCorreo())}" data-cta="correo">✉ Escribirnos</a>
      <button type="button" class="btn" data-copiar-correo>${escapar(CONFIG.boletin.correo)}</button>
    </div>
    <p class="nota" id="nota-correo">Toca la dirección para copiarla si tu teléfono no abre el correo.</p>`;
  }
  return `
    <h2>Entérate cuando ${quien} avance</h2>
    <p class="dim">Te escribimos cuando ${quien} dé un paso en el camino: una ley nueva, una estrategia o una inversión, con el enlace a la fuente.</p>
    <form class="form-correo" id="form-correo" novalidate>
      <input type="email" name="email" required autocomplete="email" placeholder="tu@correo.com" spellcheck="false" aria-label="Tu correo">
      <button type="submit" class="btn btn-primario">Suscribirme</button>
    </form>
    <p class="nota" id="nota-correo">Sin spam. Te das de baja con un clic.</p>`;
}

function htmlYoutube() {
  const nombre = CONFIG.youtube.nombre ? ` <b>${escapar(CONFIG.youtube.nombre)}</b>` : "";
  return `
    <h2>Míralo explicado en video</h2>
    <p class="dim">En nuestro canal${nombre} explicamos qué significa cada desarrollo para la región: qué cambia, a quién afecta y qué viene después.</p>
    <a class="btn btn-youtube" href="${escapar(urlSuscripcionYoutube())}" target="_blank" rel="noopener" data-cta="youtube">▶ Suscribirme en YouTube</a>`;
}

function renderIntro() {
  const nombre = pasos[paso];
  const html = { inicio: htmlInicio, correo: htmlCorreo, youtube: htmlYoutube }[nombre]();
  const ultimo = paso === pasos.length - 1;
  const barra = pasos.map((_, i) => `<i class="${i <= paso ? "hecho" : ""}"></i>`).join("");

  $("#intro").innerHTML = `
    <div class="dialogo-cab intro-cab">
      <span>Bienvenido a Superinteligencia Latam</span>
      <span class="progreso" aria-label="Paso ${paso + 1} de ${pasos.length}">${barra}</span>
    </div>
    <div class="dialogo-cuerpo intro-cuerpo">${html}</div>
    <div class="dialogo-pie">
      <button type="button" class="btn btn-texto" data-intro="saltar">${ultimo ? "Cerrar" : "Ahora no"}</button>
      <button type="button" class="btn ${nombre === "inicio" ? "btn-primario" : ""}" data-intro="siguiente" autofocus>${ultimo ? "Empezar →" : "Siguiente →"}</button>
    </div>`;
}

function abrirIntro(desde = "inicio") {
  pasos = pasosActivos();
  paso = Math.max(0, pasos.indexOf(desde));
  paisElegido = memoria.leer("pais") || "";
  renderIntro();
  const d = $("#intro");
  if (!d.open) d.showModal();
}

function cerrarIntro() {
  memoria.guardar("intro", "visto");
  if ($("#intro").open) $("#intro").close();
}

function aplicarRama() {
  memoria.guardar("pais", paisElegido);
  if (estado.pais !== paisElegido) { estado.pais = paisElegido; estado.etapa = ""; render(); }
}

function avanzar() {
  if (pasos[paso] === "inicio") aplicarRama();
  if (paso < pasos.length - 1) { paso++; renderIntro(); } else cerrarIntro();
}

async function suscribir(form) {
  const input = form.email;
  const nota = $("#nota-correo");
  if (!input.checkValidity()) {
    nota.textContent = "Escribe un correo válido.";
    nota.className = "nota error";
    input.focus();
    return;
  }
  const datos = new FormData();
  datos.append(CONFIG.boletin.campo, input.value.trim());
  if (paisElegido) datos.append("tag", paisElegido);
  form.querySelector("button").disabled = true;
  nota.textContent = "Enviando…";
  nota.className = "nota";
  try {
    // Los proveedores no suelen permitir CORS: se envía sin leer la respuesta
    // y el proveedor confirma por correo (doble opt-in).
    await fetch(CONFIG.boletin.accion, { method: "POST", body: datos, mode: "no-cors" });
    memoria.guardar("suscrito", "1");
    nota.textContent = "✓ Listo. Revisa tu correo para confirmar la suscripción.";
    nota.className = "nota ok";
    setTimeout(avanzar, 1600);
  } catch {
    form.querySelector("button").disabled = false;
    nota.textContent = "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.";
    nota.className = "nota error";
  }
}

/* ---------- Aviso discreto (visitas siguientes) ---------- */

function avisoPendiente() {
  const cerrado = Number(memoria.leer("aviso-cerrado") || 0);
  if (Date.now() - cerrado < CONFIG.diasEntreAvisos * 864e5) return null;
  if (hayBoletin() && !memoria.leer("suscrito")) return "correo";
  if (hayYoutube() && !memoria.leer("youtube")) return "youtube";
  return null;
}

function mostrarAviso() {
  const tipo = avisoPendiente();
  if (!tipo || $("#intro").open) return;
  const elegido = memoria.leer("pais");
  const pais = elegido && A.paises[elegido] ? nombrePais(elegido) : "";
  const texto = tipo === "correo"
    ? (pais ? `¿Sigues ${escapar(pais)}? Te avisamos por correo cuando dé el próximo paso.` : "Te avisamos por correo cuando un país avance hacia la singularidad.")
    : "Mira cada desarrollo explicado en nuestro canal de YouTube.";
  const boton = tipo === "correo"
    ? `<button type="button" class="btn btn-primario" data-aviso="correo">Suscribirme</button>`
    : `<a class="btn btn-youtube" href="${escapar(urlSuscripcionYoutube())}" target="_blank" rel="noopener" data-cta="youtube">▶ Ver canal</a>`;
  const aviso = $("#aviso");
  aviso.innerHTML = `<p>${texto}</p><div>${boton}<button type="button" class="cerrar" data-aviso="cerrar" aria-label="Cerrar">×</button></div>`;
  aviso.hidden = false;
}

function cerrarAviso() {
  memoria.guardar("aviso-cerrado", String(Date.now()));
  $("#aviso").hidden = true;
}

/* ---------- Accesos permanentes en el lateral ---------- */

function renderSeguir() {
  const items = [
    hayBoletin() && `<button type="button" class="seguir" data-abrir="correo">✉ Recibir avisos por correo</button>`,
    hayYoutube() && `<a class="seguir" href="${escapar(urlSuscripcionYoutube())}" target="_blank" rel="noopener" data-cta="youtube">▶ Canal de YouTube</a>`,
    `<button type="button" class="seguir" data-abrir="inicio">Ver la introducción</button>`,
  ].filter(Boolean);
  $("#seguir").innerHTML = items.join("");
  // Sin correo ni canal configurados, la franja no tiene nada que ofrecer.
  $("#seguir").closest(".seguir-banda").hidden = !hayBoletin() && !hayYoutube();
}

/* ---------- Eventos ---------- */

function eventosBienvenida() {
  const intro = $("#intro");
  intro.addEventListener("click", (ev) => {
    const chip = ev.target.closest(".chip-rama");
    if (chip) {
      paisElegido = chip.dataset.rama;
      intro.querySelectorAll(".chip-rama").forEach((c) => c.setAttribute("aria-pressed", c === chip));
      return;
    }
    const b = ev.target.closest("[data-intro]");
    if (b?.dataset.intro === "saltar") { if (pasos[paso] === "inicio") aplicarRama(); cerrarIntro(); }
    if (b?.dataset.intro === "siguiente") avanzar();
  });
  intro.addEventListener("submit", (ev) => { ev.preventDefault(); suscribir(ev.target); });
  intro.addEventListener("cancel", () => memoria.guardar("intro", "visto"));

  $("#aviso").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-aviso]");
    if (b?.dataset.aviso === "cerrar") cerrarAviso();
    if (b?.dataset.aviso === "correo") { $("#aviso").hidden = true; abrirIntro("correo"); }
  });

  $("#seguir").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-abrir]");
    if (b) abrirIntro(b.dataset.abrir);
  });

  // Un clic en el canal o en "Escribirnos" cuenta como suscripción.
  document.addEventListener("click", (ev) => {
    if (ev.target.closest('[data-cta="youtube"]')) { memoria.guardar("youtube", "1"); $("#aviso").hidden = true; }
    if (ev.target.closest('[data-cta="correo"]')) { memoria.guardar("suscrito", "1"); $("#aviso").hidden = true; }
    const copiarCorreo = ev.target.closest("[data-copiar-correo]");
    if (copiarCorreo) copiar(copiarCorreo, CONFIG.boletin.correo);
  });

  // Quien ya leyó tres noticias en esta visita recibe el aviso aunque no sea su primera vez.
  let abiertos = 0;
  $("#lista").addEventListener("click", (ev) => {
    if (ev.target.closest(".noticia-cab") && ++abiertos === 3 && memoria.leer("intro")) mostrarAviso();
  });
}

listo.then(() => {
  if (!A) return;
  renderSeguir();
  eventosBienvenida();

  const visitas = Number(memoria.leer("visitas") || 0) + 1;
  memoria.guardar("visitas", String(visitas));

  if (!memoria.leer("intro")) {
    // Quien llega por un enlace a una noticia la lee primero; la bienvenida espera.
    setTimeout(() => abrirIntro(), estado.abierta ? 12000 : 1200);
  } else if (visitas > 1) {
    setTimeout(mostrarAviso, 20000);
  }
});
