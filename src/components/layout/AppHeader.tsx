import { useEffect, useState } from 'react';
import { MenuOpciones } from './MenuOpciones';
import { Marca, SesionCajero } from './Sesion';

const formato = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/** Reloj — Tiene su propio intervalo de 1 s para que solo se repinte él y no la pantalla entera. */
function Reloj() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  // "07/11/2026, 17:12:47" -> "07/11/2026 · 17:12:47"
  return (
    <span className="text-body tabular-nums">{formato.format(ahora).replace(', ', ' · ')}</span>
  );
}

interface Props {
  atajos: boolean;
  onAtajos: (valor: boolean) => void;
  menuAbiertoInicial?: boolean;
}

/**
 * AppHeader — Cabecera fija: marca, cajero, reloj y menú Opciones. El estado de las pistas de teclado
 * llega de `App` porque lo leen componentes de toda la pantalla.
 */
export function AppHeader({ atajos, onAtajos, menuAbiertoInicial }: Props) {
  return (
    <header className="relative z-20 flex items-center justify-between border-b border-line bg-surface px-5 xl:px-7">
      <div className="flex items-center gap-4">
        <Marca />
        <SesionCajero />
      </div>
      <div className="flex items-center gap-4 font-medium text-ink-muted">
        <Reloj />
        <MenuOpciones atajos={atajos} onAtajos={onAtajos} abiertoInicial={menuAbiertoInicial} />
      </div>
    </header>
  );
}
