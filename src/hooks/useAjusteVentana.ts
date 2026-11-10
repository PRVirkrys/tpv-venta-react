import { useEffect, useState, type CSSProperties } from 'react';

/** Tamaño de diseño del TPV: por debajo, la demo se escala entera para que se vea completa. */
const ANCHO_DISENO = 1024;
const ALTO_DISENO = 768;

const medir = () => Math.min(1, innerWidth / ANCHO_DISENO, innerHeight / ALTO_DISENO);

/**
 * Solo en la demo publicada: si la ventana es menor que 1024 × 768, la pantalla se dibuja a 1024 × 768 o
 * más y se reduce para ocupar justo la ventana, sin barras de desplazamiento. Devuelve la escala
 * (1 = tamaño real) y el estilo para la raíz de la aplicación.
 */
export function useAjusteVentana(activo: boolean): { escala: number; estilo?: CSSProperties } {
  const [escala, setEscala] = useState(() => (activo ? medir() : 1));
  useEffect(() => {
    if (!activo) return;
    const ajustar = () => setEscala(medir());
    addEventListener('resize', ajustar);
    return () => removeEventListener('resize', ajustar);
  }, [activo]);

  // El body exige 1024 px de ancho (index.css); con la vista reducida dejaría desplazamiento lateral.
  useEffect(() => {
    if (escala === 1) return;
    document.body.style.minWidth = '0';
    return () => {
      document.body.style.minWidth = '';
    };
  }, [escala]);

  if (escala === 1) return { escala };
  return {
    escala,
    estilo: {
      width: innerWidth / escala,
      height: innerHeight / escala,
      transform: `scale(${escala})`,
      transformOrigin: '0 0',
    },
  };
}
