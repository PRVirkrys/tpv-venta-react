import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { abrir, filas } from './test-utils';

const estadoEscaner = () => document.getElementById('foco-escaner')!;

describe('el foco no se pierde', () => {
  it('al cancelar un diálogo vuelve al botón que lo abrió', async () => {
    abrir('productos');
    const descartar = screen.getByRole('button', { name: /Descartar venta/ });
    await userEvent.click(descartar);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(descartar).toHaveFocus());
  });

  it('al confirmar un borrado (el botón desaparece) pasa al estado del escáner', async () => {
    abrir('productos');
    await userEvent.click(within(filas()[0]).getByRole('button', { name: 'Borrar producto' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Borrar producto',
      }),
    );
    await waitFor(() => expect(estadoEscaner()).toHaveFocus());
  });

  it('al descartar la venta pasa al estado del escáner', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: /Descartar venta/ }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Descartar venta',
      }),
    );
    await waitFor(() => expect(estadoEscaner()).toHaveFocus());
  });

  it('al guardar una cantidad (el editor se cierra) pasa al estado del escáner', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('4{Enter}');
    await waitFor(() => expect(estadoEscaner()).toHaveFocus());
  });

  it('al cerrar el código manual pasa al estado del escáner', async () => {
    abrir('productos');
    await userEvent.keyboard('{F2}');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(estadoEscaner()).toHaveFocus());
  });

  it('al guardar el catálogo pasa al estado del escáner', async () => {
    abrir('productos');
    await userEvent.keyboard('{F4}');
    const catalogo = screen.getByRole('dialog', { name: 'Catálogo rápido' });
    await userEvent.click(within(catalogo).getByRole('button', { name: /Guardar productos/ }));
    await waitFor(() => expect(estadoEscaner()).toHaveFocus());
  });

  it('si el foco ya está en un control, no se le quita', async () => {
    abrir('productos');
    const boton = screen.getAllByRole('button', { name: 'Añadir una unidad' }).at(-1)!;
    await userEvent.click(boton);
    await new Promise((r) => setTimeout(r, 150));
    expect(boton).toHaveFocus();
  });
});
