import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { abrir, filas, filasTrasElDialogo, total } from './test-utils';

/** Un lector físico teclea de golpe: sin esperas entre teclas (con esperas, bajo carga, parecería una persona). */
const lector = userEvent.setup({ delay: null });

const tarjeta = () => screen.getByRole('region', { name: 'Escáner' });

describe('lector de códigos (teclado rápido + Enter)', () => {
  it('un código válido seguido de Enter registra el producto: primero, seleccionado y sin aviso', async () => {
    abrir('productos');
    await lector.keyboard('841000200001{Enter}'); // Leche entera 1 l
    expect(filas()).toHaveLength(5);
    expect(filas()[0]).toHaveAccessibleName(/Leche entera 1 l, 1 unidad/);
    expect(filas()[0]).toHaveAttribute('aria-current', 'true');
    expect(within(tarjeta()).getByText('Escáner listo')).toBeInTheDocument();
    expect(total()).toBe('14,05 €'); // 12,90 + 1,15
  });

  it('el mismo código otra vez suma una unidad y sube la línea al primer lugar', async () => {
    abrir('productos');
    await lector.keyboard('841000100004{Enter}'); // Arroz, última línea
    expect(filas()).toHaveLength(4);
    expect(filas()[0]).toHaveAccessibleName(/Arroz grano redondo 1 kg, 2 unidades/);
  });

  it('con una venta vacía empieza la venta', async () => {
    abrir('vacia');
    await lector.keyboard('841000500001{Enter}');
    expect(filas()).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Venta en curso' })).toBeInTheDocument();
  });

  it('un código que no existe abre la entrada manual con el aviso y no cambia la venta', async () => {
    abrir('productos');
    await lector.keyboard('000000000000{Enter}');
    expect(within(tarjeta()).getByText('Producto no encontrado')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Introducir código manual' })).toBeInTheDocument();
    expect(filas()).toHaveLength(4);
  });

  it('lecturas seguidas añaden cada producto', async () => {
    abrir('vacia');
    await lector.keyboard('841000100001{Enter}841000100002{Enter}841000100001{Enter}');
    expect(filas()).toHaveLength(2);
    expect(filas()[0]).toHaveAccessibleName(/Cerveza lata 33 cl, 2 unidades/);
  });

  it('con el código manual abierto, escanear lo cierra y registra el producto', async () => {
    abrir('productos');
    await userEvent.keyboard('n'); // abre la entrada manual (simulador)
    (document.activeElement as HTMLElement).blur();
    await new Promise((r) => setTimeout(r, 120)); // una persona no escanea 80 ms después de pulsar una tecla
    await lector.keyboard('841000200001{Enter}');
    expect(
      screen.queryByRole('region', { name: 'Introducir código manual' }),
    ).not.toBeInTheDocument();
    expect(filas()).toHaveLength(5);
  });

  it('una persona que teclea despacio no se toma por un lector', async () => {
    abrir('productos');
    const lento = userEvent.setup({ delay: 150 });
    await lento.keyboard('1234{Enter}');
    expect(filas()).toHaveLength(4);
    expect(within(tarjeta()).getByText('Escáner listo')).toBeInTheDocument();
  });

  it('un Enter suelto, o con muy pocos dígitos, no hace nada', async () => {
    abrir('productos');
    await lector.keyboard('{Enter}');
    await lector.keyboard('12{Enter}');
    expect(filas()).toHaveLength(4);
    expect(
      screen.queryByRole('region', { name: 'Introducir código manual' }),
    ).not.toBeInTheDocument();
  });

  it('las letras rompen la lectura: no se interpreta como código', async () => {
    abrir('productos');
    await lector.keyboard('8410x00100001{Enter}');
    expect(filas()).toHaveLength(4);
    expect(
      screen.queryByRole('region', { name: 'Introducir código manual' }),
    ).not.toBeInTheDocument();
  });

  it('si hay un campo con el foco (código manual), el lector escribe ahí y no registra por su cuenta', async () => {
    abrir('productos');
    await userEvent.keyboard('{F2}');
    const campo = within(
      screen.getByRole('region', { name: 'Introducir código manual' }),
    ).getByRole('textbox');
    await userEvent.keyboard('841000200001');
    expect(campo).toHaveValue('841000200001');
    expect(filas()).toHaveLength(4);
  });

  it('el Enter del lector no pulsa el botón que tenga el foco (por ejemplo, Cobrar)', async () => {
    abrir('productos');
    screen.getByRole('button', { name: /Cobrar/ }).focus();
    await lector.keyboard('841000200001{Enter}');
    expect(filas()).toHaveLength(5);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('con un diálogo abierto la lectura se ignora', async () => {
    abrir('productos');
    await userEvent.keyboard('{F8}');
    expect(screen.getByRole('dialog', { name: 'Finalizar venta' })).toBeInTheDocument();
    await lector.keyboard('841000200001{Enter}');
    expect(filasTrasElDialogo()).toHaveLength(4);
  });

  it('con una cantidad sin guardar, escanear pregunta antes de registrar', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('7');
    (document.activeElement as HTMLElement).blur(); // el lector actúa fuera del campo
    await lector.keyboard('841000200001{Enter}');
    const aviso = screen.getByRole('alertdialog', {
      name: 'Tienes una cantidad sin guardar',
    });
    expect(
      within(aviso).getByText(
        'Antes de añadir el producto escaneado, decide qué hacer con esta cantidad.',
      ),
    ).toBeInTheDocument();
    expect(filasTrasElDialogo()).toHaveLength(4);
  });

  it('con la venta completada, un escaneo válido empieza la venta nueva con ese producto', async () => {
    abrir('productos');
    await userEvent.keyboard('{F8}');
    await userEvent.click(screen.getByRole('button', { name: 'Efectivo' }));
    expect(screen.getByRole('dialog', { name: 'Venta completada' })).toBeInTheDocument();
    await lector.keyboard('841000200001{Enter}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(filas()).toHaveLength(1);
    expect(filas()[0]).toHaveAccessibleName(/Leche entera 1 l/);
  });
});
