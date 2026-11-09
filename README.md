# TPV · venta de caja

Pantalla de venta para una caja de supermercado atendida: **nueva venta → gestionar productos → cierre simulado**. Hecha con React 18 y TypeScript. El catálogo es ficticio y todo se vende por unidades.

## Cómo ejecutarlo

**Requisitos:** Node 22 o superior y npm.

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Está pensada para una pantalla táctil de **1024 × 768** y se adapta a **1366 × 768**.

**Verla desde otro dispositivo** (móvil, tableta o una pantalla táctil de la misma red): `npm run dev -- --host` y abrir la dirección `Network` que muestra la terminal. Sirve para probar el táctil de verdad.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Todas las pruebas (reglas de la venta, pantalla, teclado, accesibilidad, contraste y escalas de diseño) |
| `npm run build` | Comprueba los tipos y genera la versión final en `dist/` |
| `npm run lint` | Revisión de código |

## Cómo probarla

**Con lector de códigos:** un lector físico escribe los dígitos como un teclado muy rápido y termina con Enter. La pantalla lo reconoce sola cuando ningún campo tiene el foco. Una persona que teclea despacio no se confunde con un lector.

**Sin lector** (para revisar la prueba):

| Tecla | Qué simula |
|---|---|
| **E** | Escanear el siguiente producto del catálogo |
| **R** | Un código que no se pudo leer |
| **N** | Un producto que no está en el catálogo |

También se puede pulsar **Código manual** y escribir un código de la tabla de abajo, o usar los accesos rápidos (Panadería, Fruta y verdura, + Bolsa).

**Atajos de teclado:** **F2** código manual · **F3** otra cantidad · **F4** catálogo de panadería · **F8** cobrar · **Enter** confirma · **Esc** cancela. Se pueden ver sobre cada botón desde **Opciones → Mostrar atajos de teclado**.

**Estados de comprobación:** añadir `?estado=…` a la dirección abre la pantalla ya en una situación concreta, por ejemplo `/?estado=productos`. Los disponibles son `vacia`, `productos`, `seleccion`, `maximo`, `nombre-largo`, `importe-amplio`, `lista-larga`, `escaneo-correcto`, `lectura-error`, `codigo-error`, `codigo-manual`, `codigo-manual-error`, `editar`, `otra-cantidad`, `cantidad-error`, `cantidad-pendiente`, `cierre-pendiente`, `borrar`, `descarte`, `pago`, `completada`, `catalogo` y `atajos`. Sin parámetro, la aplicación empieza con una venta nueva vacía.

### Catálogo de ejemplo

| Código | Producto | Precio | Sección |
|---|---|---:|---|
| `841000100001` | Cerveza lata 33 cl | 2,10 € | Despensa |
| `841000100002` | Pan de molde familiar | 1,80 € | Panadería |
| `841000100003` | Manzanas Golden bolsa | 2,20 € | Fruta |
| `841000100004` | Arroz grano redondo 1 kg | 2,40 € | Despensa |
| `841000200001` | Leche entera 1 l | 1,15 € | Despensa |
| `841000200002` | Huevos camperos · 6 uds | 2,30 € | Despensa |
| `841000200003` | Café molido natural 250 g | 3,45 € | Despensa |
| `841000200005` | Pasta espirales 500 g | 0,95 € | Despensa |
| `841000200006` | Tomate frito 400 g | 1,25 € | Despensa |
| `841000200007` | Aceite de oliva virgen extra 1 l | 6,99 € | Despensa |
| `841000200008` | Azúcar blanco 1 kg | 1,35 € | Despensa |
| `841000200009` | Sal fina 1 kg | 0,65 € | Despensa |
| `841000200010` | Galletas María 800 g | 1,85 € | Despensa |
| `841000200011` | Yogur natural pack 4 | 1,40 € | Despensa |
| `841000200012` | Queso curado cuña 250 g | 3,25 € | Despensa |
| `841000200013` | Agua mineral 1,5 l | 0,60 € | Despensa |
| `841000200014` | Papel higiénico 12 rollos | 3,95 € | Despensa |
| `841000200015` | Detergente líquido 1,5 l | 5,50 € | Despensa |
| `841000200016` | Atún claro en aceite pack 3 | 2,75 € | Despensa |
| `841000400001` | Barra de pan rústica | 0,85 € | Panadería |
| `841000400002` | Baguette tradicional | 0,95 € | Panadería |
| `841000400003` | Croissant mantequilla | 1,20 € | Panadería |
| `841000400004` | Napolitana de chocolate | 1,35 € | Panadería |
| `841000400005` | Empanada gallega de atún | 3,50 € | Panadería |
| `841000500001` | Plátano de Canarias | 1,99 € | Fruta |
| `841000500002` | Naranja de mesa 1 kg | 1,75 € | Fruta |
| `841000500003` | Pera conferencia 1 kg | 1,89 € | Fruta |
| `841000500004` | Fresón de temporada 500 g | 2,90 € | Fruta |
| `841000600001` | Tomate de ensalada 1 kg | 2,10 € | Verdura |
| `841000600002` | Lechuga romana | 0,95 € | Verdura |
| `841000600003` | Zanahoria bolsa 1 kg | 1,15 € | Verdura |
| `841000600004` | Calabacín 1 kg | 1,60 € | Verdura |
| `841000600005` | Patata gallega bolsa 3 kg | 3,80 € | Verdura |
| `841000300001` | Bolsa | 0,10 € | Bolsa |

Los códigos son texto: se conservan los ceros iniciales y solo se aceptan números.

## Reglas de la venta

- **Añadir:** un producto nuevo entra el primero de la lista y queda seleccionado. Si se repite, suma 1 y sube al primer lugar. La lista vuelve arriba aunque se estuviera mirando más abajo.
- **Cantidades:** enteros de 1 a 999 por producto. Los botones − y + no reordenan la lista. Con 1 unidad, − pide confirmar el borrado.
- **Cantidad sin guardar:** si hay un número escrito en el editor y se escanea, se elige otro producto o se cobra, la pantalla pregunta: **Guardar y continuar**, **Continuar sin guardar** o **Seguir editando**.
- **Código no leído o inexistente:** se abre sola la entrada manual con el aviso en la tarjeta del escáner. La venta no cambia.
- **Dinero:** siempre en céntimos enteros, para evitar errores de decimales (3 bolsas de 0,10 € suman exactamente 0,30 €).
- **Cierre:** Efectivo o Tarjeta (simulado) y una pantalla de venta completada que no se puede cancelar. A los 3 segundos empieza una venta nueva, o antes si se escanea un producto.
- **Fuera de alcance:** pagos reales, peso, inventario, turnos, autenticación, devoluciones y backend.

## Cómo está organizado el código

```
src/
  domain/        Reglas puras, sin React: dinero, cantidades, catálogo, venta y estado de la pantalla
  components/    layout/ (pantalla), dialogs/ (diálogos, sobre el marco común Marco.tsx), ui/ (shadcn/ui)
  hooks/         Lector de códigos, simulador, atajos y foco
  lib/           Utilidades, pistas de teclado y pantalla completa en tableta
  dev/           Estados de comprobación (?estado=…)
```

- **Dos capas de estado, un solo reducer:** la **venta** (productos, cantidades, orden, selección) y la **pantalla** (qué hay en el panel derecho, qué diálogo está abierto, qué acción espera una decisión). La interfaz solo envía intenciones y dibuja el resultado, así que casi todo el comportamiento se prueba sin abrir un navegador.
- **Una sola puerta para buscar productos:** `consultarProducto(codigo)` en `src/domain/catalogo.ts`. Hoy lee un catálogo en memoria.
- **Tokens de diseño** como variables CSS en `src/index.css`, equivalentes a las variables de Figma. Los componentes usan los tokens, no colores sueltos.
- **Tipografía: el theme manda.** Open Sans Variable es la única familia, y la escala vive en `src/index.css` con estos tokens (tamaño / interlineado): `text-meta` 12 / 1,4 · `text-body` 13,5 / 1,4 · `text-name` 15 / 1,3 · `text-amount` 16,5 / 1,3 · `text-title` 18 / 1,2 · `text-heading` 20 / 1,2 · `text-display` 26 / 1,15 · `text-total` 28 / 1,1. Los nombres por defecto de Tailwind (`text-sm`, `text-xl`…) apuntan a esa misma escala, así que un componente de shadcn nuevo ya cae en ella. No se usan tamaños sueltos como `text-[15px]`: si hace falta otro, se añade al theme (y se refleja en Figma con el mismo nombre). `src/tipografia.test.ts` falla si aparece uno. Si añades un token, regístralo también en `src/lib/utils.ts`; si no, `cn` lo confunde con un color y lo descarta al combinar clases.
- **Espaciado: la escala de Tailwind (base 4 px).** Márgenes, rellenos y huecos usan los pasos de la escala (`0.5`, `1`, `1.5`, `2`, `3`, `4`, `5`, `6`, `7`, `8`: 2, 4, 6, 8, 12, 16, 20, 24, 28, 32 px), 1:1 con las variables `spacing/*` de Figma. No se usan valores arbitrarios (`px-[18px]`) ni medios pasos fuera de esa lista (`*-2.5`, `*-3.5`). Las medidas de Tailwind v4 admiten cualquier número, así que una altura exacta se escribe `h-19` (76 px), no `h-[76px]`. Solo se admiten arbitrarios con `calc()` o `min()` (por ejemplo, el ancho de un diálogo). `--touch` (56 px), `--touch-compact` (44 px), `--pay-min-h` / `--pay-min-w` (64 × 180 px, mínimo de Cobrar) y `--header-h` (58 px) son medidas propias del theme.
- **Tamaños táctiles:** 56 px por defecto; 44 px solo en cerrar y en las opciones de la cabecera, y se piden con `size="compact"` o `size="icon"` de Button, nunca con una clase suelta. Cobrar usa `size="pay"`. Los bordes de 1 y 2 px son los tokens `border-1` y `border-2`. `src/tamanos.test.ts` lo vigila.
- **Iconos:** familia cerrada definida en `src/index.css` y usada como `size-icon-*`: `xs` 12 · `sm` 20 · `md` 24 · `lg` 28 · `xl` 36 px. Un icono no usa `size-5` ni `size-[22px]`. `src/tipografia.test.ts` falla con tamaños de letra, espaciados arbitrarios o iconos fuera de la familia.

## Decisiones técnicas

- **React 18** (la versión que usa el equipo) con **TypeScript estricto**, **Vite** y **Tailwind**.
- **shadcn/ui** (copiado al proyecto, solo lo necesario: Button, Input, Dialog y AlertDialog), que se apoya en **Base UI** para el foco y el teclado de los diálogos. Los componentes se adaptaron al estilo plano del diseño (sin sombras, controles de 56 px) y a React 18 (`forwardRef`).
- **Sin librerías de estado ni de formularios:** el estado es local y pequeño; un `useReducer` basta.
- **Pruebas con Vitest y Testing Library:** reglas de la venta, flujos completos de pantalla, teclado, lector, accesibilidad con `axe-core`, contraste de la paleta y escalas de diseño (tipografía, espaciado, iconos y tamaños táctiles).

## Accesibilidad

- Todos los controles se manejan con teclado y con pantalla táctil (controles de 56 px, o 44 px en los secundarios, sin acciones que dependan del puntero).
- **Ratón y táctil:** la pantalla es táctil pero también admite ratón. Con el puntero encima los botones se oscurecen un paso suave (el hover solo existe en dispositivos con puntero) y al pulsar un paso más marcado: los principales (Cobrar, Guardar…) pasan a terracota oscuro, los neutros a gris azulado, y Descartar venta y Quitar de la venta a rojo claro con texto rojo oscuro. Un botón desactivado no responde.
- Diálogos con foco inicial en la opción segura, Escape para cancelar y devolución del foco; el clic fuera nunca cierra un diálogo de decisión.
- Errores anunciados a lectores de pantalla y enlazados a su campo. El avisador del escáner es una región de estado.
- Cifras con ancho fijo. Los estados se indican con icono y texto, no solo con color.
- **Contraste:** todos los pares de texto de la paleta llegan a 4,5:1 (AA), medidos en `src/contraste.test.ts`. Los bordes de los botones (`#cbd5e1`, 1,4:1) no llegan a 3:1 como elemento gráfico; cada botón se identifica además por su texto y su relleno.

## Integración con un backend Java (propuesta, no construida)

La prueba no incluye servidor. Así se conectaría:

- **Consulta:** `GET /api/productos/{codigo}`.
  - `200` con `{ "codigo": "841000100001", "nombre": "Cerveza lata 33 cl", "precioCentimos": 210 }`.
  - `404` si el código no existe, `400` si no son solo números, `5xx` o tiempo agotado si falla el servidor.
- **En el frontend** solo cambia `consultarProducto`, que pasaría a devolver una promesa. El reducer no cambia: ya recibe el resultado de la consulta (`encontrado`, `no-encontrado` o `codigo-invalido`). Habría que añadir un cuarto resultado, `sin-conexion`, con su aviso y la opción de reintentar, y un estado de «consultando» que evite lecturas dobles mientras responde el servidor.
- **El precio** viaja y se guarda como entero en céntimos. Conviene que lo fije el servidor en el momento de registrar el producto, no el navegador.

## Límites conocidos

- Los datos y el catálogo son simulados; no hay persistencia (recargar empieza una venta nueva).
- El buscador «Buscar en la venta…» es solo visual, como en el diseño.
- Probado con navegador de escritorio y con las dos resoluciones indicadas; no se ha probado en una pantalla táctil real ni con un lector de códigos físico (se simula con teclado).
