import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('conserva el grosor de borde del theme junto a un color de borde', () => {
    expect(cn('border-w-2', 'border-line')).toBe('border-w-2 border-line');
    expect(cn('border-w-1', 'border-line-control')).toBe('border-w-1 border-line-control');
  });

  it('el último grosor de borde gana', () => {
    expect(cn('border-w-1', 'border-w-2')).toBe('border-w-2');
  });

  it('conserva un tamaño de texto del theme junto a un color de texto', () => {
    expect(cn('text-body', 'text-select-ink')).toBe('text-body text-select-ink');
  });
});
