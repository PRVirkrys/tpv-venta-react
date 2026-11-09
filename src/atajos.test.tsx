import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { abrir, filas, total } from './test-utils';

const opciones = () => screen.getByRole('button', { name: 'Opciones' });
const interruptor = () => screen.getByRole('switch', { name: 'Mostrar atajos de teclado' });

describe('menú Opciones', () => {
  it('abre con el foco en el interruptor y se cierra con Escape devolviendo el foco al botón', async () => {
    abrir('productos');
    expect(opciones()).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(opciones());
    expect(opciones()).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(interruptor()).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(opciones()).toHaveFocus();
  });

  it('un clic fuera lo cierra sin quitarle el foco al control pulsado', async () => {
    abrir('productos');
    await userEvent.click(opciones());
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Editar cantidad' })).toBeInTheDocument();
  });

  it('el botón vuelve a cerrar el menú', async () => {
    abrir('productos');
    await userEvent.click(opciones());
    await userEvent.click(opciones());
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('«Administración» está desactivado y avisa de que no está disponible', async () => {
    abrir('productos');
    await userEvent.click(opciones());
    const admin = screen.getByRole('button', { name: /Administración/ });
    expect(admin).toBeDisabled();
    expect(within(admin).getByText('No disponible en esta demo')).toBeInTheDocument();
  });

  it('?estado=atajos abre el menú con las pistas activadas', () => {
    abrir('atajos');
    expect(interruptor()).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('F4')).toBeInTheDocument();
  });
});

describe('pistas de teclado', () => {
  const pistas = () =>
    ['E', 'F2', 'F3', 'F4', 'F8'].map((t) => screen.queryAllByText(t, { exact: true }).length);

  it('no se ven hasta activar el interruptor', () => {
    abrir('productos');
    expect(pistas()).toEqual([0, 0, 0, 0, 0]);
  });

  it('con el interruptor activo aparecen sobre cada control (E, F2, F3, F4 y F8), y se quitan al desactivar', async () => {
    abrir('productos');
    await userEvent.click(opciones());
    await userEvent.click(interruptor());
    expect(interruptor()).toHaveAttribute('aria-checked', 'true');
    expect(pistas()).toEqual([1, 1, 1, 1, 1]);
    expect(screen.getByText(/F2 · Código manual · F3 · Otra cantidad/)).toBeInTheDocument();
    await userEvent.click(interruptor());
    expect(pistas()).toEqual([0, 0, 0, 0, 0]);
  });

  it('Enter y Esc aparecen en el editor y en los diálogos', async () => {
    abrir('productos');
    await userEvent.click(opciones());
    await userEvent.click(interruptor());
    await userEvent.keyboard('{Escape}'); // cierra el menú
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    const editor = screen.getByRole('region', { name: 'Editar cantidad' });
    expect(within(editor).getByText('Enter')).toBeInTheDocument();
    expect(within(editor).getByText('Esc')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: /Descartar venta/ }));
    expect(within(screen.getByRole('alertdialog')).getByText('Esc')).toBeInTheDocument();
  });

  it('los controles anuncian su atajo a las tecnologías de apoyo, aunque las pistas estén ocultas', () => {
    abrir('productos');
    expect(screen.getByRole('button', { name: 'Código manual' })).toHaveAttribute(
      'aria-keyshortcuts',
      'F2',
    );
    expect(screen.getByRole('button', { name: 'Otra cantidad' })).toHaveAttribute(
      'aria-keyshortcuts',
      'F3',
    );
    expect(screen.getByRole('button', { name: 'Abrir catálogo de Panadería' })).toHaveAttribute(
      'aria-keyshortcuts',
      'F4',
    );
    expect(screen.getByRole('button', { name: /Cobrar/ })).toHaveAttribute(
      'aria-keyshortcuts',
      'F8',
    );
  });
});

describe('atajos F2, F3, F4 y F8', () => {
  it('F2 abre el código manual con el foco en el campo, y pulsarlo otra vez no vacía lo escrito', async () => {
    abrir('productos');
    await userEvent.keyboard('{F2}');
    const manual = screen.getByRole('region', {
      name: 'Introducir código manual',
    });
    await waitFor(() => expect(within(manual).getByRole('textbox')).toHaveFocus());
    await userEvent.keyboard('84');
    await userEvent.keyboard('{F2}');
    expect(within(manual).getByRole('textbox')).toHaveValue('84');
  });

  it('F3 abre el editor de cantidad del producto seleccionado', async () => {
    abrir('seleccion'); // pan seleccionado
    await userEvent.keyboard('{F3}');
    expect(
      screen.getByRole('heading', { name: 'Cantidad · Pan de molde familiar' }),
    ).toBeInTheDocument();
  });

  it('F3 sin producto seleccionado no hace nada', async () => {
    abrir('vacia');
    await userEvent.keyboard('{F3}');
    expect(screen.queryByRole('region', { name: 'Editar cantidad' })).not.toBeInTheDocument();
  });

  it('F4 abre el catálogo de panadería', async () => {
    abrir('productos');
    await userEvent.keyboard('{F4}');
    const catalogo = screen.getByRole('dialog', { name: 'Catálogo rápido' });
    expect(within(catalogo).getByRole('tab', { name: 'Panadería / Bollería' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('F8 cobra: abre «Finalizar venta»; con la venta vacía no hace nada', async () => {
    abrir('vacia');
    await userEvent.keyboard('{F8}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    abrir('productos');
    await userEvent.keyboard('{F8}');
    expect(screen.getByRole('dialog', { name: 'Finalizar venta' })).toBeInTheDocument();
  });

  it('con un diálogo abierto los atajos no hacen nada', async () => {
    abrir('productos');
    await userEvent.keyboard('{F8}');
    await userEvent.keyboard('{F4}');
    await userEvent.keyboard('{F2}');
    expect(screen.queryByRole('dialog', { name: 'Catálogo rápido' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Finalizar venta' })).toBeInTheDocument();
  });

  it('con una cantidad sin guardar, los atajos que cambian de contexto preguntan antes', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('9');
    await userEvent.keyboard('{F8}');
    const aviso = screen.getByRole('alertdialog', {
      name: 'Tienes una cantidad sin guardar',
    });
    expect(
      within(aviso).getByText('Antes de finalizar la venta, decide qué hacer con esta cantidad.'),
    ).toBeInTheDocument();
    await userEvent.click(within(aviso).getByRole('button', { name: 'Guardar y continuar' }));
    expect(screen.getByRole('dialog', { name: 'Finalizar venta' })).toBeInTheDocument();
  });

  it('no interfieren con las teclas del simulador ni con la venta', async () => {
    abrir('productos');
    await userEvent.keyboard('{F2}');
    await userEvent.keyboard('{Escape}');
    expect(filas()).toHaveLength(4);
    expect(total()).toBe('12,90 €');
  });
});
