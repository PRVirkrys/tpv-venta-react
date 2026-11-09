import { CircleAlert, CircleX, Delete } from 'lucide-react';
import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Atajo } from '@/lib/atajos';
import { cn } from '@/lib/utils';

const tecla =
  'h-touch rounded-control border-line-control bg-surface-subtle text-heading font-semibold text-ink';
const teclaPalabra = 'gap-1.5 px-1 text-body';

interface Props {
  /** Nombre accesible de la sección. */
  etiquetaSeccion: string;
  titulo: string;
  etiquetaCampo: string;
  placeholder: string;
  valor: string;
  /** Texto del error del campo; null si no hay. */
  error: string | null;
  textoEnviar: string;
  textoCancelar: string;
  onCambio: (texto: string) => void;
  onEnviar: () => void;
  onCancelar: () => void;
}

/** Campo + teclado numérico táctil + acciones. Lo usan el editor de cantidad y el código manual. */
export function EntradaNumerica(p: Props) {
  const campo = useRef<HTMLInputElement>(null);
  const idError = useId();

  // El campo tiene el foco desde que se abre (el lector físico y el teclado escriben ahí).
  useEffect(() => {
    campo.current?.focus();
    campo.current?.select();
  }, []);

  // Al volver a fallar, el foco regresa al campo para corregir.
  useEffect(() => {
    if (p.error) campo.current?.focus();
  }, [p.error]);

  function alPulsar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      p.onEnviar();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      p.onCancelar();
    }
  }

  const digitos = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

  return (
    <section
      aria-label={p.etiquetaSeccion}
      className="flex flex-1 flex-col justify-end gap-2 rounded-card border border-line bg-surface p-4"
    >
      <h2 className="mt-auto mb-0.5 line-clamp-2 text-name leading-snug font-bold wrap-anywhere">
        {p.titulo}
      </h2>

      <div className="relative mb-0.5 flex flex-col gap-1.5">
        {p.error ? (
          <p
            id={idError}
            role="alert"
            className="absolute inset-x-0 top-0 bg-surface text-meta leading-tight font-bold text-error-ink"
          >
            {p.error}
          </p>
        ) : null}
        <label
          htmlFor={`${idError}-campo`}
          className={cn(
            'text-meta font-bold tracking-wider text-ink-muted uppercase',
            p.error && 'invisible',
          )}
        >
          {p.etiquetaCampo}
        </label>
        <div className="relative">
          <Input
            ref={campo}
            id={`${idError}-campo`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={p.placeholder}
            value={p.valor}
            aria-invalid={p.error ? true : undefined}
            aria-describedby={p.error ? idError : undefined}
            onChange={(e) => p.onCambio(e.target.value)}
            onKeyDown={alPulsar}
            className="h-touch min-h-touch w-full rounded-control border-w-2 border-line-strong bg-surface py-0 pr-12 pl-4 text-heading md:text-heading font-bold tabular-nums text-ink placeholder:text-body md:placeholder:text-body placeholder:font-normal placeholder:text-ink-muted focus-visible:ring-0 aria-invalid:border-error-solid aria-invalid:ring-0"
          />
          {p.error ? (
            <CircleAlert
              className="pointer-events-none absolute top-1/2 right-4 size-icon-sm -translate-y-1/2 text-error-solid"
              aria-hidden
            />
          ) : null}
        </div>
      </div>

      {/* Teclado: sin foco con Tab para no alargar el recorrido; el campo ya admite teclado físico. */}
      <div className="grid grid-cols-3 gap-2">
        {digitos.map((d) => (
          <Button
            key={d}
            type="button"
            variant="outline"
            tabIndex={-1}
            className={tecla}
            onClick={() => p.onCambio(p.valor + d)}
          >
            {d}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          tabIndex={-1}
          aria-label="Limpiar todo"
          className={cn(tecla, teclaPalabra)}
          onClick={() => p.onCambio('')}
        >
          <CircleX className="size-icon-sm" aria-hidden />
          Limpiar
        </Button>
        <Button
          type="button"
          variant="outline"
          tabIndex={-1}
          className={tecla}
          onClick={() => p.onCambio(p.valor + '0')}
        >
          0
        </Button>
        <Button
          type="button"
          variant="outline"
          tabIndex={-1}
          aria-label="Borrar un dígito"
          className={cn(tecla, teclaPalabra)}
          onClick={() => p.onCambio(p.valor.slice(0, -1))}
        >
          <Delete className="size-icon-md" aria-hidden />
        </Button>
      </div>

      <div className="mt-1 grid gap-2">
        <Button
          type="button"
          aria-keyshortcuts="Enter"
          className="relative h-touch rounded-control px-5 text-name font-bold"
          onClick={p.onEnviar}
        >
          <Atajo tecla="Enter" />
          {p.textoEnviar}
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-keyshortcuts="Escape"
          className="relative h-touch rounded-control border-line-control bg-surface text-name font-semibold text-ink"
          onClick={p.onCancelar}
        >
          <Atajo tecla="Esc" />
          {p.textoCancelar}
        </Button>
      </div>
    </section>
  );
}
