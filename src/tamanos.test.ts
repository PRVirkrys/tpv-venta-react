import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cn } from './lib/utils';

/**
 * Tamaños táctiles: 56 px (`--touch`) por defecto, 44 px solo en cerrar y en las opciones de la cabecera
 * (`size="compact"` o `size="icon"` de Button) y Cobrar con su `size="pay"`.
 */
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe('tamaños táctiles', () => {
  it('cn reconoce h-touch-* y size-touch-*: size sustituye al alto anterior, y un h posterior lo afina', () => {
    expect(cn('h-touch px-3', 'size-touch-compact')).toBe('px-3 size-touch-compact');
    expect(cn('size-touch-compact', 'h-touch')).toBe('size-touch-compact h-touch');
  });

  it('el alto de 44 px se pide con size="compact" o "icon", no con una clase suelta', () => {
    const sueltas = archivos(import.meta.dirname)
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith('ui/button.tsx'))
      .filter((f) => /\bh-touch-compact\b/.test(readFileSync(f, 'utf8')));
    expect(sueltas).toEqual([]);
  });
});
