# Superinteligencia Latam

> ¿Qué tan cerca está cada país de América Latina de la singularidad?

El sitio sigue el camino de cada país hacia una inteligencia artificial cada vez más capaz, con **seis etapas** verificables:

1. **Estrategia**: una estrategia o política nacional de IA.
2. **Proyecto de ley**: un proyecto de ley de IA en el congreso.
3. **Ley**: una ley o un reglamento de IA vigente (implica la etapa 2).
4. **Autoridad**: una agencia que supervisa la IA.
5. **Cómputo propio**: inversión concreta en supercómputo o centros de datos.
6. **Modelos propios**: modelos de IA nacionales o regionales.

Cada noticia tiene su fecha, su fuente oficial y, si corresponde, la etapa que demuestra. Arriba se ve el camino horizontal de cada país; abajo, la línea de tiempo con todas las noticias.

El archivo **no se actualiza solo**. Al pulsar **Buscar novedades** se investiga cada país con Claude y búsqueda web, y los hechos nuevos se agregan con su fuente. Si nadie pulsa el botón, todo queda igual.

## Estructura

```
index.html                        # La página: el camino y la línea de tiempo
script.js                         # Dibuja todo desde data/archivo.json
bienvenida.js                     # Bienvenida en tres pasos, aviso y suscripciones (ver CONFIG)
style.css                         # Estilos (oscuro/claro automático)
data/archivo.json                 # Todo el contenido: países, etapas, estado y noticias
scripts/actualizar.mjs            # La investigación que hace el botón
.github/workflows/actualizar.yml  # Workflow que ejecuta el botón (solo manual)
```

## Activar el botón "Buscar novedades"

1. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**, con nombre `ANTHROPIC_API_KEY` y tu clave de la API de Anthropic.
2. Listo. El botón del sitio abre **Actions → Buscar novedades → Run workflow**. Solo quien tenga permiso de escritura en el repositorio puede ejecutarlo.

Al ejecutarlo puedes limitarlo a algunos países (`br,cl,mx`) o dejarlo vacío para investigarlos todos. El workflow hace commit de las noticias nuevas y GitHub Pages vuelve a publicar el sitio.

### Qué hace una investigación

Por cada país (y el ámbito regional):

1. Claude busca en la web desarrollos nuevos desde la última búsqueda, evidencia de las etapas que al país le faltan y otros hitos importantes desde 2023.
2. Los hallazgos se convierten en noticias con fecha, etapa, resumen y fuentes.
3. Se descarta toda noticia cuya fuente no haya salido de la búsqueda real, que repita una fuente o un título ya archivado, o que no tenga una fecha válida.

## Ejecutar en local

```bash
npm install
ANTHROPIC_API_KEY=... PAISES=br npm run actualizar   # investigar solo Brasil
npm run dev                                          # ver el sitio en http://localhost:8000
```

## Editar a mano

Las noticias están en `data/archivo.json` → `entradas`. El campo `etapa` las ubica en el camino (o `null` si no corresponden a ninguna etapa).

## Licencia

MIT — ver [LICENSE](LICENSE).
