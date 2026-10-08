# Notas del proyecto

## Cambios visuales: siempre en `web` y `admin`

Todo cambio visual (tema, tipografía, colores, layout, componentes de UI, estilos globales) se aplica **siempre en las dos apps**, `apps/web` y `apps/admin`, para que se vean consistentes. No dejes una app con el diseño nuevo y la otra con el anterior.

- Lo compartido va en `packages/ui` (tema, `ThemeProvider`, componentes reutilizables como el encabezado) y ambas apps lo importan.
- Lo que vive en cada app (`app/layout.tsx`, `app/globals.css`, fuentes con `next/font`) se replica en las dos.
- Verifica ambas apps (`check-types`, `lint`, `build` y en el navegador: `web` en el puerto 3000, `admin` en el 3001).

## Validación en móvil: siempre después de un cambio visual

Todo cambio visual se valida **también en móvil**, en `web` y en `admin`, antes de darlo por terminado. Se usa la skill `webapp-testing` (Playwright) con el script `.claude/scripts/mobile_check.py`, que emula un iPhone 13 (390×844, táctil) y por cada app:

- toma una captura de página completa,
- detecta elementos que se salen del ancho de la pantalla (scroll horizontal),
- reporta errores de consola y excepciones,
- si el encabezado tiene menú móvil, lo abre y toma una captura.

Con los servidores de desarrollo corriendo (`web` :3000, `admin` :3001):

```sh
~/.venvs/playwright/bin/python .claude/scripts/mobile_check.py <carpeta-de-capturas> [ruta]
```

Revisa el reporte **y las capturas**: sin desborde horizontal, sin errores de consola, textos y botones completos y legibles, y menús que abren y cierran. Para validar otra página, pasa su ruta (por ejemplo `/login`).

Si `~/.venvs/playwright` no existe en la máquina, créalo una vez:

```sh
python3 -m venv ~/.venvs/playwright
~/.venvs/playwright/bin/pip install playwright
~/.venvs/playwright/bin/playwright install chromium
```

## Diseño: referencia visual

Todo el desarrollo visual debe acercarse lo más posible al estilo de **https://alertametano.com/**. Antes de construir una pantalla nueva, revisa ese sitio y replica su lenguaje visual.

Toma de la referencia **el estilo**: colores, tipografía, espaciado, forma de los componentes y composición. **No copies** su marca, logo, textos, imágenes ni recursos; el contenido y la identidad son de este proyecto.

### Rasgos principales

- **Tema oscuro como base.** Fondo casi negro azulado (`#04060E`) y superficies oscuras translúcidas.
- **Hero a pantalla completa** con imagen de fondo oscurecida (overlay), contenido centrado: chip superior → título grande → subtítulo → CTA principal.
- **Header fijo** con fondo oscuro que se vuelve sólido al hacer scroll: marca a la izquierda (punto de color + nombre), enlaces y botón "Acceder" a la derecha.
- **Acento índigo/violeta** para CTAs, enlaces destacados y brillos.
- Secciones amplias con mucho aire, tarjetas oscuras con bordes redondeados y bordes sutiles semitransparentes.

### Tokens (medidos en el sitio)

| Elemento                     | Valor                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fondo de página              | `#04060E`                                                                                                                                           |
| Acento                       | índigo `#6366F1` → violeta `#8B5CF6`                                                                                                                |
| Título hero                  | Montserrat 700, ~84px, line-height 1.05, letter-spacing −0.02em, color `#E0E7FF`, text-shadow con brillo índigo (`0 0 48px rgba(99,102,241,.45)`)   |
| Subtítulo                    | Inter 400, ~19px, line-height 1.7, color `rgba(250,247,242,.82)`                                                                                    |
| Texto de cuerpo / navegación | Inter; enlaces del nav 14px 500, color `rgba(250,247,242,.85)`; marca 17px 600                                                                      |
| CTA principal                | Inter 700 ~15px, texto blanco, `linear-gradient(135deg, #6366F1, #8B5CF6)`, radio 10px, padding 14px 30px, sombra `0 8px 24px rgba(99,102,241,.35)` |
| Botón secundario ("Acceder") | Inter 600 14px, fondo `rgba(255,255,255,.08)`, borde `1px solid rgba(250,247,242,.3)`, radio 6px, padding 8px 18px                                  |
| Chip / etiqueta              | fondo `rgba(255,255,255,.1)`, borde `1px solid rgba(255,255,255,.18)`, radio 100px, padding 8px 18px, con icono                                     |

### Cómo implementarlo con MUI

- Los tokens van en el tema compartido `packages/ui/src/theme.tsx` (`palette`, `typography`, `shape`) y los estilos por defecto de componentes en `theme.components` (por ejemplo la variante del CTA con degradado). Evita repetir valores sueltos en `sx`.
- Tipografías: Montserrat (títulos) e Inter (texto) con `next/font/google`, expuestas como variables CSS en `<html>` y referenciadas desde el tema (ver skill `material-ui-nextjs`).
- Sigue las skills de `.claude/skills/` (`material-ui-theming`, `material-ui-styling`, `material-ui-nextjs`) para decidir entre tema, `styled()` y `sx`.
