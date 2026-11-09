import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { abrir, filas } from './test-utils';

describe('escáner y código manual (teclas R y N)', () => {
  const tarjeta = () => screen.getByRole('region', { name: 'Escáner' });
  const manual = () => screen.getByRole('region', { name: 'Introducir código manual' });
  const campo = () => within(manual()).getByRole('textbox');

  it('al inicio el escáner está listo y no hay entrada manual', () => {
    abrir('productos');
    expect(within(tarjeta()).getByText('Escáner listo')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Introducir código manual' }),
    ).not.toBeInTheDocument();
  });

  it('R: «Código no leído» y se abre sola la entrada manual con el foco en el campo, sin accesos rápidos ni inspector', async () => {
    abrir('productos');
    await userEvent.keyboard('r');
    expect(within(tarjeta()).getByText('Código no leído')).toBeInTheDocument();
    expect(
      within(tarjeta()).getByText('No se pudo leer el código. Escríbelo abajo.'),
    ).toBeInTheDocument();
    expect(campo()).toHaveFocus();
    expect(screen.queryByRole('region', { name: 'Accesos rápidos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Producto seleccionado' })).not.toBeInTheDocument();
    expect(filas()).toHaveLength(4); // la venta no cambia
  });

  it('N: «Producto no encontrado» y entrada manual abierta', async () => {
    abrir('productos');
    await userEvent.keyboard('n');
    expect(within(tarjeta()).getByText('Producto no encontrado')).toBeInTheDocument();
    expect(
      within(tarjeta()).getByText('El código no está en el catálogo. Escríbelo abajo.'),
    ).toBeInTheDocument();
    expect(campo()).toBeInTheDocument();
  });

  it('el botón «Código manual» abre la entrada con el aviso neutro', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Código manual' }));
    expect(
      within(tarjeta()).getByText('Escribe el código del producto abajo.'),
    ).toBeInTheDocument();
    expect(campo()).toHaveFocus();
  });

  it('con el foco en el campo, R y N no se interpretan como lector: se pueden escribir', async () => {
    abrir('productos');
    await userEvent.keyboard('r'); // abre la entrada manual
    await userEvent.keyboard('rn'); // ya con el foco en el campo: se escribe, no simula nada
    expect(campo()).toHaveValue('rn');
    expect(within(tarjeta()).getByText('Código no leído')).toBeInTheDocument(); // N no cambió el aviso
  });

  it('el teclado táctil escribe, borra un dígito y limpia', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Código manual' }));
    for (const t of ['8', '4', '1', '0'])
      await userEvent.click(within(manual()).getByRole('button', { name: t }));
    expect(campo()).toHaveValue('8410');
    await userEvent.click(within(manual()).getByRole('button', { name: 'Borrar un dígito' }));
    expect(campo()).toHaveValue('841');
    await userEvent.click(within(manual()).getByRole('button', { name: 'Limpiar todo' }));
    expect(campo()).toHaveValue('');
  });

  it('un código válido añade el producto, cierra la entrada y vuelve el escáner a «listo»', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Código manual' }));
    await userEvent.type(campo(), '841000200001{Enter}'); // Leche entera 1 l
    expect(filas()).toHaveLength(5);
    expect(filas()[0]).toHaveAccessibleName(/Leche entera 1 l/);
    expect(within(tarjeta()).getByText('Escáner listo')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Introducir código manual' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Accesos rápidos' })).toBeInTheDocument();
  });

  it('letras o campo vacío: error «solo números» en el campo, y la entrada sigue abierta', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Código manual' }));
    await userEvent.click(within(manual()).getByRole('button', { name: 'Añadir producto' }));
    expect(within(manual()).getByRole('alert')).toHaveTextContent(
      'Escribe un código usando solo números.',
    );
    expect(campo()).toBeInvalid();
    await userEvent.type(campo(), '12A45{Enter}');
    expect(within(manual()).getByRole('alert')).toHaveTextContent(
      'Escribe un código usando solo números.',
    );
    expect(filas()).toHaveLength(4);
  });

  it('un código que no existe: error en el campo y aviso en la tarjeta', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Código manual' }));
    await userEvent.type(campo(), '000{Enter}');
    expect(within(manual()).getByRole('alert')).toHaveTextContent(
      'Producto no encontrado. Revisa el código.',
    );
    expect(within(tarjeta()).getByText('Producto no encontrado')).toBeInTheDocument();
  });

  it('escribir después de un error lo quita', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Código manual' }));
    await userEvent.type(campo(), '12A{Enter}');
    expect(within(manual()).getByRole('alert')).toBeInTheDocument();
    await userEvent.type(campo(), '4');
    expect(within(manual()).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Escape y «Volver al escaneo» cierran la entrada y quitan el aviso', async () => {
    abrir('productos');
    await userEvent.keyboard('r');
    await userEvent.keyboard('{Escape}');
    expect(
      screen.queryByRole('region', { name: 'Introducir código manual' }),
    ).not.toBeInTheDocument();
    expect(within(tarjeta()).getByText('Escáner listo')).toBeInTheDocument();
    await userEvent.keyboard('n');
    await userEvent.click(within(manual()).getByRole('button', { name: 'Volver al escaneo' }));
    expect(within(tarjeta()).getByText('Escáner listo')).toBeInTheDocument();
  });

  it('escanear (E) con la entrada manual abierta la cierra y registra el producto', async () => {
    abrir('productos');
    await userEvent.keyboard('r');
    campo().blur(); // el lector físico actúa fuera del campo
    await userEvent.keyboard('e');
    expect(
      screen.queryByRole('region', { name: 'Introducir código manual' }),
    ).not.toBeInTheDocument();
    expect(filas()).toHaveLength(5);
  });
});
