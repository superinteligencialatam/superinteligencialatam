# Superinteligencia Latam

> Archivo abierto de los desarrollos de la inteligencia artificial y su regulación en América Latina.

Un sitio tipo periódico para seguir, en orden cronológico y con enlace a la fuente primaria, las leyes, proyectos de ley, estrategias nacionales, acuerdos regionales y avances de industria e investigación en IA en la región.

## Estructura

```
index.html        # Noticias: feed cronológico con búsqueda y filtros por país/categoría
paises.html       # Estado regulatorio por país
acerca.html       # Sobre el proyecto y cómo contribuir
data/entradas.js  # ← todo el contenido vive aquí
script.js         # Renderizado y filtros
style.css         # Estilos (claro/oscuro automático)
```

Sitio 100% estático, sin dependencias ni paso de compilación. Se publica tal cual en GitHub Pages.

## Agregar una noticia

Edita `data/entradas.js` y añade un objeto al arreglo `ENTRADAS`:

```js
{
  id: "mexico-senado-iniciativa-ia",   // único, se usa en la URL: index.html#mexico-senado-iniciativa-ia
  fecha: "2026-09-25",                 // o "2026-09" si solo sabes el mes
  pais: "mx",                          // código de PAISES, o "regional"
  categoria: "regulacion",             // regulacion | politica | industria | investigacion | infraestructura | sociedad
  titulo: "…",
  resumen: "Primer párrafo.\n\nSegundo párrafo.",
  fuentes: [{ nombre: "Senado de la República", url: "https://…" }],
  etiquetas: ["congreso"],
},
```

El orden no importa: el sitio ordena por fecha. Para actualizar el estado de un país en la página *Países*, edita `ESTADO_PAISES` en el mismo archivo.

## Enlaces útiles

Los filtros se reflejan en la URL, así que se pueden compartir:

- `index.html?pais=br` — todo lo de Brasil
- `index.html?cat=regulacion` — solo regulación
- `index.html#peru-ley-31814` — una entrada concreta

## Ver en local

```bash
python3 -m http.server 8000
```

## Licencia

MIT — ver [LICENSE](LICENSE).
