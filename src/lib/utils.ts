import { createCn } from 'cn/config';

/**
 * cn — Une clases de Tailwind resolviendo conflictos. Conoce la escala tipográfica del theme
 * (`text-meta`, `text-body`…, definida en `index.css`): sin esto la tomaría por un color y la
 * descartaría al combinarla con otro `text-*` (por ejemplo `text-select-ink`). Lo mismo con los grosores de
 * borde (`border-w-1`, `border-w-2`): sin registrarlos los tomaría por un color de `border-*` y los perdería.
 * Y los tamaños táctiles (`h-touch`, `size-touch-compact`…).
 */
export const cn = createCn({
  extend: {
    classGroups: {
      'font-size': [{ text: ['meta', 'body', 'name', 'amount', 'title', 'heading', 'display', 'total'] }],
      'border-w': [{ 'border-w': ['1', '2'] }],
      // Tamaños táctiles (`--spacing-touch*` en index.css): sin registrarlos, `size-touch-compact` y `h-touch` no
      // se reconocen como del mismo grupo y conviven, y manda la que el CSS generado ponga después.
      size: [{ size: ['touch', 'touch-compact'] }],
      h: [{ h: ['touch', 'touch-compact'] }],
      w: [{ w: ['touch', 'touch-compact'] }],
      'min-h': [{ 'min-h': ['touch', 'touch-compact'] }],
    },
  },
});
