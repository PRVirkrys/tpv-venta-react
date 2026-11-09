import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { abrir, filas, total } from './test-utils';

describe('venta vacía', () => {
  it('arranca con «Nueva venta», sin inspector, y Cobrar y Descartar desactivados', () => {
    abrir();
    expect(screen.getByRole('heading', { name: 'Nueva venta' })).toBeInTheDocument();
    expect(screen.getByText('Venta vacía')).toBeInTheDocument();
    expect(
      screen.queryByText('Producto seleccionado', { selector: 'span' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cobrar/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Descartar venta/ })).toBeDisabled();
    expect(total()).toBe('0,00 €');
  });
});

describe('escaneo (tecla E del simulador)', () => {
  it('registra productos: el nuevo queda primero, seleccionado y marcado como último añadido', async () => {
    abrir();
    await userEvent.keyboard('e');
    await userEvent.keyboard('e');
    expect(filas()).toHaveLength(2);
    expect(filas()[0]).toHaveAttribute('aria-current', 'true');
    expect(within(filas()[0]).getByText('Último añadido')).toBeInTheDocument();
    expect(within(filas()[1]).queryByText('Último añadido')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Venta en curso' })).toBeInTheDocument();
    expect(screen.getByText('2 productos · 2 unidades')).toBeInTheDocument();
  });

  it('no reacciona al escribir en un campo', async () => {
    abrir('productos');
    await userEvent.type(screen.getByRole('searchbox'), 'eee');
    expect(filas()).toHaveLength(4);
  });
});

describe('lista y selección (estado productos)', () => {
  it('muestra las 4 líneas del ejemplo con su total, y la cerveza seleccionada', () => {
    abrir('productos');
    expect(filas()).toHaveLength(4);
    expect(filas()[0]).toHaveAccessibleName(/Cerveza lata 33 cl/);
    expect(filas()[0]).toHaveAttribute('aria-current', 'true');
    expect(total()).toBe('12,90 €');
    expect(screen.getByText('4 productos · 6 unidades')).toBeInTheDocument();
  });

  it('al pulsar otra fila se selecciona sin reordenar, y el inspector cambia', async () => {
    abrir('productos');
    await userEvent.click(filas()[2]);
    expect(filas()[2]).toHaveAttribute('aria-current', 'true');
    expect(filas()[0]).not.toHaveAttribute('aria-current');
    expect(filas()[2]).toHaveAccessibleName(/Manzanas Golden bolsa/);
    const inspector = screen.getByRole('region', {
      name: 'Producto seleccionado',
    });
    expect(within(inspector).getByText('Manzanas Golden bolsa')).toBeInTheDocument();
    expect(within(inspector).getByText(/Código: 841000100003/)).toBeInTheDocument();
  });

  it('el nombre del producto tiene el mismo tamaño de letra seleccionado o no (tailwind-merge descartaba el tamaño al seleccionar)', async () => {
    abrir('productos');
    const tamanos = () =>
      filas().map((f) => f.querySelector('span.line-clamp-2')!.className.includes('text-body'));
    expect(tamanos()).toEqual([true, true, true, true]);
    await userEvent.click(filas()[2]);
    expect(tamanos()).toEqual([true, true, true, true]);
  });

  it('con teclado: Enter sobre una fila la selecciona', async () => {
    abrir('productos');
    filas()[1].focus();
    await userEvent.keyboard('{Enter}');
    expect(filas()[1]).toHaveAttribute('aria-current', 'true');
  });

  it('solo la fila seleccionada muestra los botones − y +', () => {
    abrir('productos');
    const botonesDeCantidad = (fila: HTMLElement) =>
      within(fila)
        .getAllByRole('button')
        .filter(
          (b) =>
            /Restar|Borrar producto|Añadir/.test(b.getAttribute('aria-label') ?? '') &&
            !b.className.includes('invisible'),
        );
    expect(botonesDeCantidad(filas()[0])).toHaveLength(2);
    expect(botonesDeCantidad(filas()[1])).toHaveLength(0);
  });
});

describe('cantidades', () => {
  it('+ y − de la fila cambian cantidad, importe y total sin reordenar', async () => {
    abrir('seleccion'); // pan seleccionado (1 × 1,80 €)
    const fila = filas()[1];
    await userEvent.click(within(fila).getByRole('button', { name: 'Añadir una unidad' }));
    await userEvent.click(within(fila).getByRole('button', { name: 'Añadir una unidad' }));
    expect(fila).toHaveAccessibleName(/3 unidades/);
    expect(total()).toBe('16,50 €'); // 2,10 + 3 × 1,80 + 3 × 2,20 + 2,40
    await userEvent.click(within(fila).getByRole('button', { name: 'Restar una unidad' }));
    expect(fila).toHaveAccessibleName(/2 unidades/);
    expect(filas()[1]).toBe(fila);
  });

  it('en el máximo: «+» desactivado y aviso «Máximo 999 uds»', () => {
    abrir('maximo');
    expect(screen.getByText('Máximo 999 uds')).toBeInTheDocument();
    expect(within(filas()[0]).getByRole('button', { name: 'Añadir una unidad' })).toBeDisabled();
    const inspector = screen.getByRole('region', {
      name: 'Producto seleccionado',
    });
    expect(within(inspector).getByRole('button', { name: 'Añadir una unidad' })).toBeDisabled();
    // Las líneas que no están al máximo siguen pudiendo sumar.
    expect(within(filas()[1]).getByRole('button', { name: 'Añadir una unidad' })).toBeEnabled();
  });
});

describe('listas largas y datos extremos', () => {
  it('lista larga: 20 líneas con desplazamiento propio', () => {
    abrir('lista-larga');
    expect(filas()).toHaveLength(20);
  });

  it('un nombre muy largo se recorta a 2 líneas', () => {
    abrir('nombre-largo');
    const nombre = within(filas()[0]).getByText(/Galletas integrales/);
    expect(nombre.className).toContain('line-clamp-2');
  });

  it('un importe muy grande se muestra completo con cifras tabulares', () => {
    abrir('importe-amplio');
    expect(total()).toBe('999.000,81 €'); // 999 × 999,99 + 1,80 + 6,60 + 2,40
    expect(screen.getByText('Total venta').nextElementSibling!.className).toContain('tabular-nums');
  });
});
