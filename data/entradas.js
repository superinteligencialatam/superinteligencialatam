/**
 * SUPERINTELIGENCIA LATAM — Archivo de entradas
 *
 * Cada entrada es un objeto. Para agregar una noticia, copia un bloque,
 * cambia el `id` (único, en minúsculas y con guiones) y rellena los campos.
 *
 *   id         identificador único, se usa en la URL (#id)
 *   fecha      "AAAA-MM-DD" o "AAAA-MM" si solo se conoce el mes
 *   pais       uno de los códigos en PAISES (abajo) — "regional" para toda la región
 *   categoria  uno de los códigos en CATEGORIAS (abajo)
 *   titulo     titular corto
 *   resumen    uno o dos párrafos; separa párrafos con \n\n
 *   fuentes    lista de { nombre, url } — siempre enlaza a la fuente primaria
 *   etiquetas  (opcional) palabras clave libres
 *
 * ⚠ Las entradas iniciales son un punto de partida redactado de memoria.
 *   Verifica fechas y enlaces contra la fuente oficial antes de publicar.
 */

const PAISES = {
  regional:  { nombre: "Regional",   bandera: "🌎" },
  ar:        { nombre: "Argentina",  bandera: "🇦🇷" },
  bo:        { nombre: "Bolivia",    bandera: "🇧🇴" },
  br:        { nombre: "Brasil",     bandera: "🇧🇷" },
  cl:        { nombre: "Chile",      bandera: "🇨🇱" },
  co:        { nombre: "Colombia",   bandera: "🇨🇴" },
  cr:        { nombre: "Costa Rica", bandera: "🇨🇷" },
  ec:        { nombre: "Ecuador",    bandera: "🇪🇨" },
  mx:        { nombre: "México",     bandera: "🇲🇽" },
  pa:        { nombre: "Panamá",     bandera: "🇵🇦" },
  py:        { nombre: "Paraguay",   bandera: "🇵🇾" },
  pe:        { nombre: "Perú",       bandera: "🇵🇪" },
  do:        { nombre: "Rep. Dominicana", bandera: "🇩🇴" },
  uy:        { nombre: "Uruguay",    bandera: "🇺🇾" },
  ve:        { nombre: "Venezuela",  bandera: "🇻🇪" },
};

const CATEGORIAS = {
  regulacion:      "Regulación",
  politica:        "Política pública",
  industria:       "Industria",
  investigacion:   "Investigación",
  infraestructura: "Infraestructura",
  sociedad:        "Sociedad",
};

/**
 * Estado regulatorio por país — alimenta la página "Países".
 *   nivel: "ley" (ley vigente) | "tramite" (proyecto en el congreso)
 *          | "estrategia" (solo política/estrategia) | "sin-datos"
 */
const ESTADO_PAISES = {
  br: { nivel: "tramite",    resumen: "PL 2338/2023 aprobado por el Senado (dic. 2024); en discusión en la Cámara de Diputados. Plan Brasileño de IA 2024–2028 en marcha." },
  cl: { nivel: "tramite",    resumen: "Proyecto de ley de IA basado en riesgos (Boletín 16821-19) en trámite desde 2024. Política Nacional de IA vigente." },
  co: { nivel: "tramite",    resumen: "Política Nacional de IA (CONPES 4144, 2025). Proyecto de ley del Gobierno radicado en el Congreso en 2025." },
  pe: { nivel: "ley",        resumen: "Ley 31814 (2023) que promueve el uso de la IA, con reglamento aprobado en 2025." },
  uy: { nivel: "estrategia", resumen: "Estrategia Nacional de IA a cargo de AGESIC, con mandato legal desde la Ley 20.212 (2023)." },
  mx: { nivel: "sin-datos",  resumen: "Múltiples iniciativas legislativas presentadas; pendiente de documentar." },
  ar: { nivel: "sin-datos",  resumen: "Pendiente de documentar." },
};

const ENTRADAS = [
  {
    id: "brasil-senado-aprueba-pl-2338",
    fecha: "2024-12-10",
    pais: "br",
    categoria: "regulacion",
    titulo: "El Senado de Brasil aprueba el marco legal de la inteligencia artificial",
    resumen:
      "El Senado Federal aprobó el Proyecto de Ley 2338/2023, que establece un marco regulatorio para la IA basado en niveles de riesgo, con obligaciones para sistemas de alto riesgo y la prohibición de ciertos usos considerados de riesgo excesivo.\n\nEl texto pasa ahora a la Cámara de Diputados. Es el esfuerzo regulatorio más avanzado de la región y suele compararse con el AI Act europeo.",
    fuentes: [
      { nombre: "Agência Senado", url: "https://www12.senado.leg.br/noticias" },
      { nombre: "Ficha del PL 2338/2023", url: "https://www25.senado.leg.br/web/atividade/materias/-/materia/157233" },
    ],
    etiquetas: ["PL 2338", "riesgo", "congreso"],
  },
  {
    id: "brasil-plan-ia-para-o-bem-de-todos",
    fecha: "2024-07",
    pais: "br",
    categoria: "politica",
    titulo: "Brasil presenta su Plan Brasileño de IA 2024–2028",
    resumen:
      "El Gobierno federal presentó el plan \"IA para o Bem de Todos\", con una inversión anunciada de alrededor de R$ 23 mil millones para infraestructura de cómputo, formación, IA en servicios públicos y apoyo a la industria nacional.",
    fuentes: [
      { nombre: "Ministério da Ciência, Tecnologia e Inovação", url: "https://www.gov.br/mcti" },
    ],
    etiquetas: ["PBIA", "inversión", "cómputo"],
  },
  {
    id: "chile-proyecto-ley-ia",
    fecha: "2024-05",
    pais: "cl",
    categoria: "regulacion",
    titulo: "Chile ingresa al Congreso un proyecto de ley para regular los sistemas de IA",
    resumen:
      "El Ejecutivo presentó un proyecto de ley (Boletín 16821-19) que clasifica los sistemas de IA según su nivel de riesgo e impone obligaciones proporcionales, siguiendo un enfoque similar al europeo.",
    fuentes: [
      { nombre: "Cámara de Diputadas y Diputados de Chile", url: "https://www.camara.cl" },
    ],
    etiquetas: ["riesgo", "congreso"],
  },
  {
    id: "colombia-conpes-4144",
    fecha: "2025-02",
    pais: "co",
    categoria: "politica",
    titulo: "Colombia aprueba su Política Nacional de Inteligencia Artificial (CONPES 4144)",
    resumen:
      "El Consejo Nacional de Política Económica y Social aprobó el documento CONPES 4144, que fija la hoja de ruta del país en IA: ética y gobernanza, datos e infraestructura, talento, investigación y adopción en el sector público y productivo.",
    fuentes: [
      { nombre: "Departamento Nacional de Planeación", url: "https://www.dnp.gov.co" },
    ],
    etiquetas: ["CONPES", "estrategia"],
  },
  {
    id: "colombia-proyecto-ley-gobierno",
    fecha: "2025-07",
    pais: "co",
    categoria: "regulacion",
    titulo: "El Gobierno de Colombia radica un proyecto de ley para regular la IA",
    resumen:
      "El Ministerio de Ciencia, Tecnología e Innovación, junto con otras carteras, radicó en el Congreso un proyecto de ley para regular el desarrollo y uso de la IA en el país. Se suma a varias iniciativas parlamentarias previas.",
    fuentes: [
      { nombre: "Minciencias", url: "https://minciencias.gov.co" },
    ],
    etiquetas: ["congreso"],
  },
  {
    id: "peru-ley-31814",
    fecha: "2023-07",
    pais: "pe",
    categoria: "regulacion",
    titulo: "Perú promulga la Ley 31814, que promueve el uso de la inteligencia artificial",
    resumen:
      "Perú se convirtió en uno de los primeros países de la región con una ley específica sobre IA. La norma declara de interés nacional el uso de la IA para el desarrollo económico y social, y asigna a la Presidencia del Consejo de Ministros la rectoría a través de la Secretaría de Gobierno y Transformación Digital.",
    fuentes: [
      { nombre: "Diario Oficial El Peruano", url: "https://busquedas.elperuano.pe" },
    ],
    etiquetas: ["ley"],
  },
  {
    id: "peru-reglamento-ley-31814",
    fecha: "2025-09",
    pais: "pe",
    categoria: "regulacion",
    titulo: "Perú aprueba el reglamento de su ley de inteligencia artificial",
    resumen:
      "El Poder Ejecutivo aprobó el reglamento de la Ley 31814, que desarrolla un enfoque basado en riesgos, obligaciones de transparencia y lineamientos para el uso de IA en la administración pública.",
    fuentes: [
      { nombre: "Plataforma del Estado Peruano (gob.pe)", url: "https://www.gob.pe/pcm" },
    ],
    etiquetas: ["reglamento", "riesgo"],
  },
  {
    id: "uruguay-ley-20212-agesic",
    fecha: "2023-11",
    pais: "uy",
    categoria: "politica",
    titulo: "Uruguay da mandato legal a AGESIC para la estrategia nacional de IA",
    resumen:
      "La Ley 20.212 de Rendición de Cuentas encomendó a la Agencia de Gobierno Electrónico y Sociedad de la Información (AGESIC) el diseño de la estrategia nacional de inteligencia artificial y de datos, con participación de múltiples actores.",
    fuentes: [
      { nombre: "AGESIC", url: "https://www.gub.uy/agencia-gobierno-electronico-sociedad-informacion-conocimiento" },
    ],
    etiquetas: ["estrategia", "AGESIC"],
  },
  {
    id: "regional-declaracion-santiago",
    fecha: "2023-10",
    pais: "regional",
    categoria: "politica",
    titulo: "Declaración de Santiago: la región acuerda principios comunes para una IA ética",
    resumen:
      "En la primera Cumbre Ministerial y de Altas Autoridades de América Latina y el Caribe sobre la ética de la IA, organizada por Chile y la UNESCO, más de veinte países firmaron la Declaración de Santiago y acordaron coordinarse en gobernanza de la IA.",
    fuentes: [
      { nombre: "UNESCO", url: "https://www.unesco.org/es/artificial-intelligence" },
    ],
    etiquetas: ["UNESCO", "cooperación"],
  },
  {
    id: "regional-declaracion-montevideo",
    fecha: "2024-10",
    pais: "regional",
    categoria: "politica",
    titulo: "Segunda cumbre regional sobre ética de la IA culmina con la Declaración de Montevideo",
    resumen:
      "Uruguay acogió la segunda cumbre ministerial regional sobre ética de la IA. Los países participantes adoptaron la Declaración de Montevideo y una hoja de ruta para avanzar hacia posiciones comunes en foros internacionales.",
    fuentes: [
      { nombre: "UNESCO", url: "https://www.unesco.org/es/artificial-intelligence" },
    ],
    etiquetas: ["UNESCO", "cooperación"],
  },
];
