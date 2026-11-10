import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

/** Sin pantalla completa (por ejemplo, Safari en iPhone): una ventana nueva al tamaño de 1366 × 768. */
const abrirVentana = () => window.open(location.href, '_blank', 'popup,width=1366,height=768');

/**
 * Botón de la demo publicada para verla a tamaño completo, porque el navegador no siempre deja probarla a
 * tamaño real. Usa la pantalla completa del navegador (Esc también sale) y, si no está disponible, abre una
 * ventana nueva.
 */
export function BotonPantallaCompleta({ reducida }: { reducida: boolean }) {
  const [activa, setActiva] = useState(() => Boolean(document.fullscreenElement));
  useEffect(() => {
    const alCambiar = () => setActiva(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, []);

  function alternar() {
    if (!document.fullscreenEnabled) return abrirVentana();
    if (document.fullscreenElement) return void document.exitFullscreen().catch(() => {});
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(abrirVentana);
  }

  const Icono = activa ? Minimize2 : Maximize2;
  return (
    <Button
      type="button"
      variant="ghost"
      size="compact"
      className="gap-2 rounded-control px-3 font-semibold text-ink-muted"
      title={reducida ? 'Vista reducida para que quepa en la ventana' : undefined}
      onClick={alternar}
    >
      <Icono className="size-icon-sm" aria-hidden />
      <span className="flex flex-col items-start leading-tight">
        {activa ? 'Salir de pantalla completa' : 'Pantalla completa'}
        {reducida && !activa ? (
          <small className="text-meta font-normal">Vista reducida</small>
        ) : null}
      </span>
    </Button>
  );
}
