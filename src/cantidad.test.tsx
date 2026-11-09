import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { abrir, filas, filasTrasElDialogo, total } from './test-utils';

describe('borrar un producto', () => {
  const dialogo = () => screen.getByRole('alertdialog', { name: '¿Borrar este producto?' });
  const sinDialogo = () => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

  it('«−» en la fila con 1 unidad está activo y abre la confirmación, sin cambiar la venta', async () => {
    abrir('productos');
    const menos = within(filas()[0]).getByRole('button', {
      name: 'Borrar producto',
    });
    expect(menos).toBeEnabled();
    await userEvent.click(menos);
    expect(dialogo()).toBeInTheDocument();
    expect(within(dialogo()).getByText('Cerveza lata 33 cl')).toBeInTheDocument();
    expect(within(dialogo()).getByText('1 unidad se quitará de la venta.')).toBeInTheDocument();
    expect(filasTrasElDialogo()).toHaveLength(4);
  });

  it('«−» del panel derecho con 1 unidad abre la misma confirmación', async () => {
    abrir('productos');
    const inspector = screen.getByRole('region', {
      name: 'Producto seleccionado',
    });
    await userEvent.click(within(inspector).getByRole('button', { name: 'Borrar producto' }));
    expect(dialogo()).toBeInTheDocument();
  });

  it('«Quitar de la venta» también abre la confirmación', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Quitar de la venta' }));
    expect(dialogo()).toBeInTheDocument();
  });

  it('con varias unidades, «−» resta sin preguntar', async () => {
    abrir('productos');
    await userEvent.click(filas()[2]); // manzanas × 3
    await userEvent.click(within(filas()[2]).getByRole('button', { name: 'Restar una unidad' }));
    sinDialogo();
    expect(filas()[2]).toHaveAccessibleName(/2 unidades/);
  });

  it('el diálogo indica cuántas unidades se quitan', async () => {
    abrir('productos');
    await userEvent.click(filas()[2]);
    await userEvent.click(screen.getByRole('button', { name: 'Quitar de la venta' }));
    expect(within(dialogo()).getByText('3 unidades se quitarán de la venta.')).toBeInTheDocument();
  });

  it('el foco inicial está en «Cancelar»', async () => {
    abrir('productos');
    await userEvent.click(within(filas()[0]).getByRole('button', { name: 'Borrar producto' }));
    await waitFor(() =>
      expect(within(dialogo()).getByRole('button', { name: 'Cancelar' })).toHaveFocus(),
    );
  });

  it('Escape y «Cancelar» cierran sin borrar', async () => {
    abrir('productos');
    await userEvent.click(within(filas()[0]).getByRole('button', { name: 'Borrar producto' }));
    await userEvent.keyboard('{Escape}');
    sinDialogo();
    expect(filas()).toHaveLength(4);
    await userEvent.click(within(filas()[0]).getByRole('button', { name: 'Borrar producto' }));
    await userEvent.click(within(dialogo()).getByRole('button', { name: 'Cancelar' }));
    sinDialogo();
    expect(filas()).toHaveLength(4);
  });

  it('el clic fuera no cierra el diálogo', async () => {
    abrir('productos');
    await userEvent.click(within(filas()[0]).getByRole('button', { name: 'Borrar producto' }));
    await userEvent.click(document.body);
    expect(dialogo()).toBeInTheDocument();
  });

  it('«Borrar producto» quita la línea, recalcula el total y deja sin selección (se oculta el inspector)', async () => {
    abrir('productos');
    await userEvent.click(within(filas()[0]).getByRole('button', { name: 'Borrar producto' }));
    await userEvent.click(within(dialogo()).getByRole('button', { name: 'Borrar producto' }));
    sinDialogo();
    expect(filas()).toHaveLength(3);
    expect(total()).toBe('10,80 €');
    expect(screen.queryByRole('region', { name: 'Producto seleccionado' })).not.toBeInTheDocument();
  });

  it('con el diálogo abierto el simulador del escáner no registra productos', async () => {
    abrir('productos');
    await userEvent.click(within(filas()[0]).getByRole('button', { name: 'Borrar producto' }));
    await userEvent.keyboard('e');
    expect(filasTrasElDialogo()).toHaveLength(4);
  });

  it('?estado=borrar abre el diálogo del producto seleccionado', () => {
    abrir('borrar');
    expect(dialogo()).toBeInTheDocument();
  });
});

describe('editor de cantidad', () => {
  const editor = () => screen.getByRole('region', { name: 'Editar cantidad' });
  const campo = () => within(editor()).getByRole('textbox');
  const sinEditor = () =>
    expect(screen.queryByRole('region', { name: 'Editar cantidad' })).not.toBeInTheDocument();

  it('«Otra cantidad» abre el editor con la cantidad actual, el foco y el texto seleccionado; el escáner y los accesos se ocultan', async () => {
    abrir('seleccion'); // pan seleccionado
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    expect(
      within(editor()).getByRole('heading', {
        name: 'Cantidad · Pan de molde familiar',
      }),
    ).toBeInTheDocument();
    expect(campo()).toHaveValue('1');
    expect(campo()).toHaveFocus();
    expect((campo() as HTMLInputElement).selectionStart).toBe(0);
    expect((campo() as HTMLInputElement).selectionEnd).toBe(1);
    expect(screen.queryByRole('region', { name: 'Escáner' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Accesos rápidos' })).not.toBeInTheDocument();
  });

  it('tocar el número del panel derecho o el de la fila también abre el editor', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Editar cantidad: 1' }));
    expect(campo()).toHaveValue('1');
    await userEvent.click(within(editor()).getByRole('button', { name: 'Cancelar' }));
    sinEditor();
    await userEvent.click(
      within(filas()[2]).getByRole('button', {
        name: /Editar cantidad de Manzanas Golden bolsa: 3/,
      }),
    );
    expect(
      within(editor()).getByRole('heading', {
        name: 'Cantidad · Manzanas Golden bolsa',
      }),
    ).toBeInTheDocument();
    expect(campo()).toHaveValue('3');
  });

  it('escribir una cantidad y pulsar «Guardar cantidad» la aplica, sin reordenar, y vuelve a la vista normal', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('12');
    await userEvent.click(within(editor()).getByRole('button', { name: 'Guardar cantidad' }));
    sinEditor();
    expect(filas()[0]).toHaveAccessibleName(/12 unidades/);
    expect(filas()[0]).toHaveAccessibleName(/Cerveza/);
    expect(total()).toBe('36,00 €'); // 12 × 2,10 + 1,80 + 6,60 + 2,40
    expect(screen.getByRole('region', { name: 'Escáner' })).toBeInTheDocument();
  });

  it('Enter guarda y Escape cancela', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('5{Enter}');
    expect(filas()[0]).toHaveAccessibleName(/5 unidades/);
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('9{Escape}');
    sinEditor();
    expect(filas()[0]).toHaveAccessibleName(/5 unidades/);
  });

  it('el teclado táctil escribe, borra un dígito y limpia', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.click(within(editor()).getByRole('button', { name: 'Limpiar todo' }));
    await userEvent.click(within(editor()).getByRole('button', { name: '4' }));
    await userEvent.click(within(editor()).getByRole('button', { name: '2' }));
    expect(campo()).toHaveValue('42');
    await userEvent.click(within(editor()).getByRole('button', { name: 'Borrar un dígito' }));
    expect(campo()).toHaveValue('4');
  });

  it.each(['0', '1000', '2.5', 'abc', ''])(
    'la cantidad %j da error en el campo y el editor sigue abierto',
    async (texto) => {
      abrir('productos');
      await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
      await userEvent.click(within(editor()).getByRole('button', { name: 'Limpiar todo' }));
      if (texto) await userEvent.type(campo(), texto);
      await userEvent.click(within(editor()).getByRole('button', { name: 'Guardar cantidad' }));
      expect(within(editor()).getByRole('alert')).toHaveTextContent(
        'Escribe una cantidad entera de 1 a 999.',
      );
      expect(campo()).toBeInvalid();
      expect(campo()).toHaveFocus();
      expect(filas()[0]).toHaveAccessibleName(/1 unidad/);
    },
  );

  it('escribir de nuevo quita el error', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('0{Enter}');
    expect(within(editor()).getByRole('alert')).toBeInTheDocument();
    await userEvent.keyboard('3');
    expect(within(editor()).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('?estado=editar y ?estado=cantidad-error', () => {
    abrir('cantidad-error');
    expect(within(editor()).getByRole('alert')).toBeInTheDocument();
    expect(campo()).toHaveValue('1000');
  });
});

describe('cantidad sin guardar', () => {
  const aviso = () =>
    screen.getByRole('alertdialog', {
      name: 'Tienes una cantidad sin guardar',
    });
  const sinAviso = () => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  const editor = () => screen.getByRole('region', { name: 'Editar cantidad' });
  const campo = () => within(editor()).getByRole('textbox');

  /** Editor abierto sobre la cerveza (1 ud) con 7 escrito (sustituye al texto seleccionado) y sin guardar. */
  async function editandoSiete() {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('7');
  }

  it('sin cambios no pregunta: elegir otra fila cierra el editor y la selecciona', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.click(filas()[1]);
    sinAviso();
    expect(filas()[1]).toHaveAttribute('aria-current', 'true');
    expect(screen.queryByRole('region', { name: 'Editar cantidad' })).not.toBeInTheDocument();
  });

  it('con cambios, elegir otra fila pregunta, con las cantidades y el foco en «Seguir editando»', async () => {
    await editandoSiete();
    await userEvent.click(filas()[1]);
    expect(
      within(aviso()).getByText(
        'Antes de editar otro producto, decide qué hacer con esta cantidad.',
      ),
    ).toBeInTheDocument();
    expect(within(aviso()).getByText('Cerveza lata 33 cl')).toBeInTheDocument();
    const valores = within(aviso()).getAllByText(/^\d+$/);
    expect(valores.map((v) => v.textContent)).toEqual(['1', '7']);
    await waitFor(() =>
      expect(within(aviso()).getByRole('button', { name: 'Seguir editando' })).toHaveFocus(),
    );
  });

  it('«Seguir editando» (o Escape) conserva el borrador y no cambia la selección', async () => {
    await editandoSiete();
    await userEvent.click(filas()[1]);
    await userEvent.click(within(aviso()).getByRole('button', { name: 'Seguir editando' }));
    sinAviso();
    expect(campo()).toHaveValue('7');
    await userEvent.click(filas()[1]);
    await userEvent.keyboard('{Escape}');
    sinAviso();
    expect(campo()).toHaveValue('7');
    expect(filas({ hidden: false })[0]).toHaveAttribute('aria-current', 'true');
  });

  it('«Guardar y continuar» guarda la cantidad y cambia a la otra fila', async () => {
    await editandoSiete();
    await userEvent.click(filas()[1]);
    await userEvent.click(within(aviso()).getByRole('button', { name: 'Guardar y continuar' }));
    sinAviso();
    expect(filas()[0]).toHaveAccessibleName(/Cerveza lata 33 cl, 7 unidades/);
    expect(filas()[1]).toHaveAttribute('aria-current', 'true');
  });

  it('«Continuar sin guardar» descarta el borrador y cambia a la otra fila', async () => {
    await editandoSiete();
    await userEvent.click(filas()[1]);
    await userEvent.click(within(aviso()).getByRole('button', { name: 'Continuar sin guardar' }));
    sinAviso();
    expect(filas()[0]).toHaveAccessibleName(/1 unidad/);
    expect(filas()[1]).toHaveAttribute('aria-current', 'true');
    expect(screen.queryByRole('region', { name: 'Editar cantidad' })).not.toBeInTheDocument();
  });

  it('escanear (E) con cambios sin guardar pregunta; guardar registra el producto y la lista vuelve arriba', async () => {
    await editandoSiete();
    (document.activeElement as HTMLElement).blur();
    await userEvent.keyboard('e');
    expect(
      within(aviso()).getByText(
        'Antes de añadir el producto escaneado, decide qué hacer con esta cantidad.',
      ),
    ).toBeInTheDocument();
    expect(filasTrasElDialogo()).toHaveLength(4); // todavía no se registró
    await userEvent.click(within(aviso()).getByRole('button', { name: 'Guardar y continuar' }));
    sinAviso();
    expect(filas()).toHaveLength(5);
    expect(filas()[0]).not.toHaveAccessibleName(/Cerveza/);
    expect(filas()[1]).toHaveAccessibleName(/Cerveza lata 33 cl, 7 unidades/);
  });

  it('«Guardar y continuar» con un borrador inválido vuelve al editor con el error', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('0'); // «10»? el texto estaba seleccionado: queda «0»
    await userEvent.click(filas()[1]);
    await userEvent.click(within(aviso()).getByRole('button', { name: 'Guardar y continuar' }));
    sinAviso();
    expect(within(editor()).getByRole('alert')).toHaveTextContent(
      'Escribe una cantidad entera de 1 a 999.',
    );
    expect(filas()[0]).toHaveAttribute('aria-current', 'true');
  });
});
