import { OctagonX, Pointer, ScanBarcode } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { BotonDialogo, Marco } from '@/components/dialogs/Marco';
import { ID_FOCO_ESCANER } from '@/hooks/useFocoEstable';
import { cn } from '@/lib/utils';

/* Mini ilustraciones hechas con las piezas y tokens de la propia pantalla (sin capturas que se queden
   desfasadas). Son decorativas: el texto de cada paso dice lo mismo. El pulso se apaga con
   `prefers-reduced-motion` (variante `motion-safe`). */

const tecla =
  'grid size-touch-compact place-items-center rounded-control border-w-2 border-line-strong bg-surface text-title font-bold';
const pulso =
  'absolute inset-0 rounded-control ring-2 ring-primary ring-offset-2 ring-offset-canvas motion-safe:animate-pulse';

function Escena({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="flex min-h-30 items-center justify-center gap-5 rounded-card border border-line bg-canvas px-5 py-4"
    >
      {children}
    </div>
  );
}

function TarjetaEscaner({ error }: { error?: boolean }) {
  const Icono = error ? OctagonX : ScanBarcode;
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
      <span
        className={cn(
          'grid size-touch-compact place-items-center rounded-control',
          error ? 'bg-error-surface text-error-ink' : 'bg-success-surface text-success-ink',
        )}
      >
        <Icono className="size-icon-md" />
      </span>
      <span className="flex flex-col">
        <strong className="text-body leading-tight">
          {error ? 'Código no leído' : 'Escáner listo'}
        </strong>
        <span className="text-meta text-ink-muted">
          {error ? 'Escríbelo abajo' : 'Esperando código'}
        </span>
      </span>
    </div>
  );
}

function EscenaAnadir() {
  return (
    <Escena>
      <span className="relative">
        <span className={tecla}>E</span>
        <span className={pulso} />
      </span>
      <TarjetaEscaner />
    </Escena>
  );
}

function EscenaCantidad() {
  const paso =
    'grid size-touch-compact place-items-center rounded-control border border-line-control bg-surface text-title font-bold';
  return (
    <Escena>
      <div className="flex items-center gap-4 rounded-card border-l-4 border-l-select-line bg-select-tint py-2 pr-3 pl-4">
        <span className="text-body font-bold text-select-ink">Leche entera 1 l</span>
        <span className="flex items-center gap-1">
          <span className={paso}>−</span>
          <span className="relative">
            <span className={cn(paso, 'tabular-nums')}>2</span>
            <span className={pulso} />
            <Pointer className="absolute -right-3 -bottom-4 size-icon-md fill-surface text-ink" />
          </span>
          <span className={paso}>+</span>
        </span>
      </div>
    </Escena>
  );
}

function EscenaLectura() {
  return (
    <Escena>
      <span className="flex gap-2">
        <span className={tecla}>R</span>
        <span className={tecla}>N</span>
      </span>
      <TarjetaEscaner error />
      <span className="relative grid grid-cols-3 gap-1">
        {['7', '8', '9', '4', '5', '6'].map((d) => (
          <span
            key={d}
            className="grid size-7 place-items-center rounded-chip border border-line-control bg-surface text-meta font-bold"
          >
            {d}
          </span>
        ))}
      </span>
    </Escena>
  );
}

const PASOS = [
  {
    titulo: 'Añadir productos',
    texto:
      'Pulsen E para simular un escaneo, o toquen Código manual. Si un producto se repite, su cantidad sube en 1.',
    Escena: EscenaAnadir,
  },
  {
    titulo: 'Cambiar la cantidad',
    texto:
      'Toquen el número para escribir la cantidad con el teclado numérico. − y + restan o suman una unidad; con 1 unidad, − pide confirmar.',
    Escena: EscenaCantidad,
  },
  {
    titulo: 'Si falla la lectura',
    texto:
      'R simula un código que no se pudo leer y N, uno que no existe. Se abre la entrada manual: escriban el código y confirmen. Para terminar, Cobrar o F8.',
    Escena: EscenaLectura,
  },
] as const;

/**
 * Intro de la demo publicada (`VITE_GUIA_REVISION=1`, lo decide `App`): tres pasos cortos que se pueden
 * saltar. No forma parte del diseño del TPV. Mientras está abierta, `App` no pasa las teclas de venta
 * (E, N, R, F2…) al reducer. Al cerrarla, el foco vuelve al estado del escáner y empiezan las pistas.
 */
export function GuiaRevision({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const principal = useRef<HTMLButtonElement>(null);
  const [indice, setIndice] = useState(0);
  const paso = PASOS[indice];
  const ultimo = indice === PASOS.length - 1;

  const cerrar = () => {
    onCerrar();
    setIndice(0);
  };

  return (
    <Marco
      modo="proceso"
      abierto={abierta}
      onCerrar={cerrar}
      tono="neutro"
      titulo="Guía para revisar la prueba"
      descripcion="No es parte del TPV: tres pasos para probarlo en un minuto."
      focoInicial={principal}
      focoFinal={() => document.getElementById(ID_FOCO_ESCANER)}
      acciones={
        <>
          <span className="mr-auto flex items-center gap-2 self-center text-meta text-ink-muted">
            <span className="flex gap-1.5" aria-hidden>
              {PASOS.map((p, i) => (
                <span
                  key={p.titulo}
                  className={cn(
                    'size-2 rounded-full',
                    i === indice ? 'bg-primary' : 'bg-line-control',
                  )}
                />
              ))}
            </span>
            Paso {indice + 1} de {PASOS.length}
          </span>
          {!ultimo && (
            <BotonDialogo atajo="Esc" onClick={cerrar}>
              Saltar
            </BotonDialogo>
          )}
          <BotonDialogo
            ref={principal}
            variante="primario"
            onClick={ultimo ? cerrar : () => setIndice(indice + 1)}
          >
            {ultimo ? 'Empezar a probar' : 'Siguiente'}
          </BotonDialogo>
        </>
      }
    >
      {/* Se anuncia cada paso nuevo sin mover el foco del botón principal. */}
      <div aria-live="polite" className="flex flex-col gap-3">
        <paso.Escena />
        <h3 className="text-title leading-tight font-bold">{paso.titulo}</h3>
        <p className="text-name leading-normal text-ink">{paso.texto}</p>
        {ultimo && (
          <p className="text-body text-ink-muted">
            Pueden volver a verla en Opciones, Ver guía otra vez.
          </p>
        )}
      </div>
    </Marco>
  );
}
