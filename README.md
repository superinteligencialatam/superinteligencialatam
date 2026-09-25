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

El archivo **no se actualiza solo**. Es un proyecto administrado a mano: cuando el administrador lo pide, Claude Code investiga las novedades y, tras su aprobación, las agrega. Si nadie lo pide, todo queda igual. Los visitantes pueden proponer noticias por correo.

## Estructura

```
index.html                        # La página: el camino y la línea de tiempo
script.js                         # Dibuja todo desde data/archivo.json
bienvenida.js                     # Bienvenida en tres pasos, aviso y suscripciones (ver CONFIG)
style.css                         # Estilos (oscuro/claro automático)
data/archivo.json                 # Todo el contenido: países, etapas, estado y noticias
.claude/commands/buscar-novedades.md  # Instrucciones del comando /buscar-novedades
```

## Buscar novedades

Abre este proyecto en Claude Code y escribe:

```
/buscar-novedades            # todos los países
/buscar-novedades cl mx      # solo Chile y México
```

Claude investiga con búsqueda web (priorizando las etapas que le faltan a cada país), verifica cada enlace y te muestra los hallazgos. Solo después de tu aprobación los agrega a `data/archivo.json` como una actualización nueva, y te pregunta si subirlos.

## Ver en local

```bash
python3 -m http.server 8000
```

## Editar a mano

Las noticias están en `data/archivo.json` → `entradas`. El campo `etapa` las ubica en el camino (o `null` si no corresponden a ninguna etapa).

## Licencia

MIT — ver [LICENSE](LICENSE).
