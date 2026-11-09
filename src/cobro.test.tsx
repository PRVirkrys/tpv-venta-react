import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { abrir, filas, total } from './test-utils';

describe('descartar venta', () => {
  const dialogo = () => screen.getByRole('alertdialog', { name: '¿Descartar esta venta?' });
  const abrirDescartar = async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: /Descartar venta/ }));
  };

  it('abre la confirmación con el resumen de la compra y el foco en «Seguir con la venta»', async () => {
    await abrirDescartar();
    expect(
      within(dialogo()).getByText('Se quitarán todos los productos y comenzarás una venta nueva.'),
    ).toBeInTheDocument();
    expect(within(dialogo()).getByText('4 productos')).toBeInTheDocument();
    expect(within(dialogo()).getByText('6 unidades')).toBeInTheDocument();
    expect(
      within(dialogo()).getByText('12,90 €', {
        normalizer: (t) => t.replace(/\s/g, ' '),
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(within(dialogo()).getByRole('button', { name: 'Seguir con la venta' })).toHaveFocus(),
    );
  });

  it('Escape, «Seguir con la venta» y el clic fuera no descartan', async () => {
    await abrirDescartar();
    await userEvent.click(document.body);
    expect(dialogo()).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Descartar venta/ }));
    await userEvent.click(within(dialogo()).getByRole('button', { name: 'Seguir con la venta' }));
    expect(filas()).toHaveLength(4);
  });

  it('«Descartar venta» vacía la venta y vuelve a «Nueva venta» con el total a cero', async () => {
    await abrirDescartar();
    await userEvent.click(within(dialogo()).getByRole('button', { name: 'Descartar venta' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nueva venta' })).toBeInTheDocument();
    expect(total()).toBe('0,00 €');
  });

  it('con una cantidad sin guardar pregunta primero («finalizar la venta») y luego abre el descarte', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('9');
    await userEvent.click(screen.getByRole('button', { name: /Descartar venta/ }));
    const aviso = screen.getByRole('alertdialog', {
      name: 'Tienes una cantidad sin guardar',
    });
    expect(
      within(aviso).getByText('Antes de finalizar la venta, decide qué hacer con esta cantidad.'),
    ).toBeInTheDocument();
    await userEvent.click(within(aviso).getByRole('button', { name: 'Continuar sin guardar' }));
    expect(dialogo()).toBeInTheDocument();
  });

  it('?estado=descarte', () => {
    abrir('descarte');
    expect(dialogo()).toBeInTheDocument();
  });
});

describe('pago', () => {
  const pago = () => screen.getByRole('dialog', { name: 'Finalizar venta' });
  const completada = () => screen.getByRole('dialog', { name: 'Venta completada' });
  const abrirPago = async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: /Cobrar/ }));
  };

  it('Cobrar abre «Finalizar venta» con el total y el foco en Efectivo', async () => {
    await abrirPago();
    expect(within(pago()).getByText('¿Cómo paga el cliente?')).toBeInTheDocument();
    expect(
      within(pago()).getByText('12,90 €', {
        normalizer: (t) => t.replace(/\s/g, ' '),
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(within(pago()).getByRole('button', { name: 'Efectivo' })).toHaveFocus(),
    );
    expect(within(pago()).getByRole('button', { name: 'Tarjeta' })).toBeInTheDocument();
  });

  it('la ×, Escape y «Volver a la venta» cancelan; el clic fuera no', async () => {
    await abrirPago();
    await userEvent.click(document.body);
    expect(pago()).toBeInTheDocument();
    await userEvent.click(within(pago()).getByRole('button', { name: 'Volver a la venta' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Cobrar/ }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(filas()).toHaveLength(4);
  });

  it('elegir Tarjeta muestra «Venta completada» con el método y el total', async () => {
    await abrirPago();
    await userEvent.click(within(pago()).getByRole('button', { name: 'Tarjeta' }));
    expect(within(completada()).getByText('Tarjeta')).toBeInTheDocument();
    expect(
      within(completada()).getByText('12,90 €', {
        normalizer: (t) => t.replace(/\s/g, ' '),
      }),
    ).toBeInTheDocument();
    expect(
      within(completada()).getByText('Escanea un producto para empezar antes.'),
    ).toBeInTheDocument();
  });

  it('con una cantidad sin guardar pregunta antes de cobrar; al guardar abre el pago con la cantidad nueva', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('2');
    await userEvent.click(screen.getByRole('button', { name: /Cobrar/ }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Guardar y continuar',
      }),
    );
    expect(
      within(pago()).getByText('15,00 €', {
        normalizer: (t) => t.replace(/\s/g, ' '),
      }),
    ).toBeInTheDocument(); // 2 × 2,10 + 1,80 + 6,60 + 2,40
  });

  it('?estado=pago y ?estado=completada', () => {
    abrir('pago');
    expect(pago()).toBeInTheDocument();
  });
});
