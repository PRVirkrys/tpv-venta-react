import { useRef } from 'react';
import { ID_FOCO_ESCANER } from '@/hooks/useFocoEstable';
import { BotonDialogo, Marco } from './Marco';

const PASOS: readonly { tecla: string; texto: string }[] = [
  {
    tecla: 'E',
    texto:
      'Escanea el siguiente producto del catálogo. Al terminar el catálogo vuelve a empezar y suma 1 a los que ya están, como si se escaneara otra vez el mismo.',
  },
  {
    tecla: '+ Bolsa ×2',
    texto: 'Forma rápida de verlo: repetir un producto suma 1 a su cantidad, no lo duplica.',
  },
  { tecla: 'N', texto: 'Código que no existe: aparece el aviso y la entrada manual.' },
  { tecla: 'R', texto: 'Lectura fallida: se abre la entrada manual para escribir el código.' },
  { tecla: 'F3', texto: 'Cambia la cantidad del producto seleccionado.' },
  { tecla: '−', texto: 'Con 1 unidad, pide confirmar antes de quitar el producto.' },
  { tecla: 'F8', texto: 'Finaliza la venta y elige cómo paga el cliente.' },
];

/**
 * Guía para quien revisa la prueba: qué probar en un minuto. No forma parte del diseño del TPV.
 * Solo existe en la versión publicada (`VITE_GUIA_REVISION=1` al compilar; lo decide `App`).
 * Mientras está abierta, `App` no pasa las teclas de venta (E, N, R, F2…) al reducer.
 */
export function GuiaRevision({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const empezar = useRef<HTMLButtonElement>(null);

  return (
    <Marco
      modo="proceso"
      abierto={abierta}
      onCerrar={onCerrar}
      tono="neutro"
      titulo="Guía para revisar la prueba"
      descripcion="Esta ventana no es parte del TPV: solo resume qué probar en un minuto. Pueden usar el teclado o tocar los botones."
      focoInicial={empezar}
      focoFinal={() => document.getElementById(ID_FOCO_ESCANER)}
      acciones={
        <BotonDialogo ref={empezar} variante="primario" atajo="Esc" onClick={onCerrar}>
          Empezar a probar
        </BotonDialogo>
      }
    >
      <ol className="flex flex-col gap-2">
        {PASOS.map(({ tecla, texto }) => (
          <li
            key={tecla}
            className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-baseline gap-3"
          >
            <kbd className="justify-self-start rounded-chip border border-line-control bg-surface-subtle px-2 font-sans text-body font-bold whitespace-nowrap text-ink">
              {tecla}
            </kbd>
            <span>{texto}</span>
          </li>
        ))}
      </ol>
      <p className="text-body text-ink-muted">
        El total se calcula solo en cada paso. Para ver las teclas sobre cada botón: Opciones,
        Mostrar atajos de teclado.
      </p>
    </Marco>
  );
}
