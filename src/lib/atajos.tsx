import { useContext } from 'react';
import { AtajosContext } from './atajosContexto';

/** Pista de teclado sobre un control (no ocupa espacio). Colocar dentro de un elemento con `relative`. */
export function Atajo({ tecla }: { tecla: string }) {
  const visibles = useContext(AtajosContext);
  if (!visibles) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-2 right-2 min-w-6 rounded-chip border border-ink-muted bg-surface px-1.5 text-center text-meta font-bold text-ink"
    >
      {tecla}
    </span>
  );
}
