---
description: Investiga novedades de IA por país y las agrega al archivo tras aprobación
argument-hint: "[países, p. ej. cl mx regional — vacío = todos]"
---

Busca novedades para el archivo de Superinteligencia Latam y agrégalas a `data/archivo.json`.

Países a investigar: $ARGUMENTS
(Si está vacío, investiga todos los de `paises` en `data/archivo.json`, incluido `regional`.)

## 1. Lee el estado actual

Lee `data/archivo.json`. Para cada país a investigar, anota:
- la fecha de la última actualización (`actualizaciones` → el último elemento),
- las noticias que ya tiene (títulos y URLs, para no repetirlas),
- qué etapas de `etapas` ya tienen evidencia y cuáles no. La etapa `ley` implica `proyecto`.

## 2. Investiga con búsqueda web

Por cada país, en este orden de prioridad:
1. **Etapas sin evidencia**: ¿el país ya cumplió esa etapa, sin importar la fecha? Busca el hecho que lo demuestre.
2. **Novedades** desde la última actualización.
3. **Otros hitos importantes desde 2023** que falten.

Para `regional`, busca solo hechos de alcance regional o multilateral (CEPAL, UNESCO, OEA, CAF, BID, cumbres ministeriales, Latam-GPT…). No les asignes etapa.

Criterios:
- Solo hechos con fecha, no opiniones ni análisis.
- Fuente primaria u oficial siempre que exista (gaceta, congreso, ministerio, organismo); si no, un medio reputado.
- La URL debe ser el documento o comunicado concreto, nunca la portada del sitio.
- Un anuncio, un borrador o un proyecto no cuenta como ley aprobada.
- Máximo unas 6 noticias por país, las más relevantes. Si no hay nada nuevo y verificable, no inventes nada.

## 3. Verifica

- Comprueba que cada URL responde:
  `curl -s -o /dev/null -w '%{http_code}' -L -A 'Mozilla/5.0' URL`.
  Si un sitio bloquea curl (403), ábrelo en el navegador integrado y confirma que muestra el documento.
- Comprueba la fecha exacta contra la fuente.
- Descarta cualquier noticia cuya fuente ya esté en el archivo o que repita un hecho ya registrado.

## 4. Muestra los hallazgos ANTES de guardar

Presenta una tabla por país: fecha, título, etapa (o "—") y fuente. Señala las etapas que se llenarían y cualquier cambio en `estado_paises`. **Espera la aprobación del usuario** antes de escribir.

## 5. Guarda (solo tras aprobación)

1. Crea una actualización nueva al final de `actualizaciones`:
   `{ "id": <7 caracteres hex aleatorios>, "fecha": <ahora en ISO>, "mensaje": "N noticias nuevas (País, País)", "paises": [códigos] }`
2. Agrega cada noticia a `entradas` con este formato:
   ```json
   {
     "id": "pais-titulo-en-minusculas-con-guiones",
     "fecha": "AAAA-MM-DD",
     "pais": "cl",
     "categoria": "regulacion | politica | industria | investigacion | infraestructura | sociedad",
     "titulo": "Titular corto en español",
     "resumen": "Uno o dos párrafos en español, separados por \n\n.",
     "fuentes": [{ "nombre": "Institución — nombre del documento", "url": "https://..." }],
     "etiquetas": ["..."],
     "etapa": "estrategia | proyecto | ley | autoridad | computo | modelos | null",
     "actualizacion": "<id de la actualización nueva>"
   }
   ```
   Usa `"AAAA-MM"` si solo se conoce el mes.
3. Si el estado regulatorio de un país cambió, actualiza su `estado_paises` (`nivel`: `ley` | `tramite` | `estrategia` | `sin-datos`).
4. Valida el JSON: `node -e 'JSON.parse(require("fs").readFileSync("data/archivo.json","utf8"))'`.
5. Revisa el sitio en el navegador integrado (`python3 -m http.server`) y confirma que el camino y la línea de tiempo muestran lo nuevo.
6. Pregunta si hacer commit y subir a `main`.
