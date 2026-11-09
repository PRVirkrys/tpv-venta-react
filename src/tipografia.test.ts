import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * El theme (`index.css`) es la única fuente de la escala tipográfica: los componentes usan sus tokens
 * (`text-meta`, `text-body`, `text-name`, `text-amount`, `text-title`, `text-heading`, `text-display`,
 * `text-total`) y nunca un tamaño suelto como `text-[15px]`. Si hace falta otro tamaño, se añade al theme.
 */
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe('tipografía', () => {
  it('ningún componente usa tamaños de letra sueltos (text-[…px] o text-[…rem])', () => {
    const sueltos = archivos(join(import.meta.dirname, 'components'))
      .filter((f) => /\.tsx?$/.test(f))
      .flatMap((f) =>
        [
          ...readFileSync(f, 'utf8').matchAll(
            /(?<![\w-])(?:[a-z-]+:)*text-\[[\d.]+(?:px|rem|em)\]/g,
          ),
        ].map((m) => `${f.split('/src/')[1]}: ${m[0]}`),
      );
    expect(sueltos).toEqual([]);
  });

  it('las clases por defecto de Tailwind (text-sm, text-xl…) caen en la escala del theme', () => {
    const css = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8');
    for (const t of ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl']) {
      expect(css).toMatch(new RegExp(`--text-${t}: var\\(--text-[a-z]+\\);`));
    }
  });

  it('ningún componente usa espaciados arbitrarios (p-[…], px-[…], gap-[…], m-[…], space-*-[…])', () => {
    // Quedan fuera las expresiones con calc() o min(), que no tienen equivalente en la escala (p. ej. el ancho de un diálogo).
    const arbitrarios = archivos(join(import.meta.dirname, 'components'))
      .filter((f) => /\.tsx?$/.test(f))
      .flatMap((f) =>
        [
          ...readFileSync(f, 'utf8').matchAll(
            /(?<![\w-])(?:[a-z-]+:)*-?(?:p[xytblrse]?|m[xytblrse]?|gap(?:-[xy])?|space-[xy])-\[(?![^\]]*(?:calc|min|max)\()[^\]]+\]/g,
          ),
        ].map((m) => `${f.split('/src/')[1]}: ${m[0]}`),
      );
    expect(arbitrarios).toEqual([]);
  });

  it('los iconos usan la familia size-icon-* (12, 20, 24, 28, 36 px) definida en el theme', () => {
    const css = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8');
    for (const t of ['xs', 'sm', 'md', 'lg', 'xl'])
      expect(css).toMatch(new RegExp(`--spacing-icon-${t}: var\\(--icon-${t}\\);`));
    const fueraDeFamilia = archivos(join(import.meta.dirname, 'components'))
      .filter((f) => /\.tsx?$/.test(f) && !f.includes('/ui/'))
      .flatMap((f) =>
        [
          ...readFileSync(f, 'utf8').matchAll(
            /<[A-Z][A-Za-z]+ [^>]*className="[^"]*(?<![\w-])size-(?:\d|\[)[^"]*"/g,
          ),
        ]
          .map((m) => `${f.split('/src/')[1]}: ${m[0]}`)
          .filter((l) => !/ShoppingCart|<Button|<Atajo/.test(l)),
      );
    expect(fueraDeFamilia).toEqual([]);
  });
});
