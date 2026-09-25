# Superinteligencia Latam

> Archivo abierto de la inteligencia artificial y su regulación en América Latina, versionado como un repositorio.

Cada **país es una rama** y cada hecho es un **nodo** con su fecha y su fuente primaria. El sitio los dibuja como un `git log --graph`.

El archivo **no se actualiza solo**. Al pulsar **⟳ fetch noticias** se investiga cada país con Claude y búsqueda web, y los hallazgos nuevos entran como un **merge** encima de los nodos existentes. Si nadie pulsa el botón, el archivo queda exactamente como está.

## Estructura

```
index.html                     # El grafo: ramas, historial de fetch, README
script.js                      # Dibuja el grafo desde data/archivo.json
style.css                      # Estilos (oscuro/claro automático)
data/archivo.json              # ← todo el contenido: países, estado, fetches y nodos
scripts/actualizar.mjs         # La investigación que hace el botón
.github/workflows/actualizar.yml  # Workflow que ejecuta el botón (solo manual)
```

## Activar el botón "fetch noticias"

1. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**, con nombre `ANTHROPIC_API_KEY` y tu clave de la API de Anthropic.
2. Listo. El botón del sitio abre **Actions → fetch noticias → Run workflow**. Solo quien tenga permiso de escritura en el repositorio puede ejecutarlo.

Al ejecutarlo puedes limitarlo a algunos países (`br,cl,mx`) o dejarlo vacío para investigarlos todos. El workflow hace commit de los nodos nuevos y GitHub Pages vuelve a publicar el sitio.

### Qué hace una investigación

Por cada país (y el ámbito regional):

1. Claude busca en la web desarrollos nuevos desde el último fetch, y hitos importantes desde 2023 que falten.
2. Los hallazgos se convierten en nodos con fecha, categoría, resumen y fuentes.
3. Se descarta todo nodo cuya fuente no haya salido de la búsqueda real, que repita una fuente o un título ya archivado, o que no tenga una fecha válida.

## Ejecutar en local

```bash
npm install
ANTHROPIC_API_KEY=... PAISES=br npm run actualizar   # investigar solo Brasil
npm run dev                                          # ver el sitio en http://localhost:8000
```

## Editar a mano

Los nodos están en `data/archivo.json` → `entradas`. Cada uno pertenece a una `actualizacion` (un fetch) de la lista `actualizaciones`.

## Licencia

MIT — ver [LICENSE](LICENSE).
