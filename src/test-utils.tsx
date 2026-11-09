import { render, screen, within } from '@testing-library/react';
import App from '@/App';

/** Abre la aplicación con un estado de comprobación (`?estado=…`). */
export const abrir = (estado?: string) => {
  history.replaceState(null, '', estado ? `/?estado=${estado}` : '/');
  return render(<App />);
};

export const filas = (opciones?: { hidden: boolean }) =>
  within(screen.getByRole('list', opciones)).getAllByRole('listitem', opciones);

/** Con un diálogo modal abierto el resto de la página queda oculta para lectores de pantalla. */
export const filasTrasElDialogo = () =>
  within(within(document.querySelector('main')!).getByRole('list', { hidden: true })).getAllByRole(
    'listitem',
    { hidden: true },
  );

export const total = () =>
  screen.getByText('Total venta').nextElementSibling!.textContent!.replace(/\s/g, ' ');
