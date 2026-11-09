import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { abrir, filas, filasTrasElDialogo, total } from './test-utils';

describe('catálogo rápido', () => {
  const catalogo = () => screen.getByRole('dialog', { name: 'Catálogo rápido' });
  const tab = (nombre: string | RegExp) => within(catalogo()).getByRole('tab', { name: nombre });
  const tarjeta = (nombre: string) =>
    within(catalogo()).getByText(nombre, { selector: 'span.font-bold' }).closest('li')!;
  const resumen = () => within(catalogo()).getByRole('contentinfo');
  const sumar = async (nombre: string, veces = 1) => {
    for (let i = 0; i < veces; i++)
      await userEvent.click(
        within(tarjeta(nombre)).getByRole('button', {
          name: `Añadir una unidad a ${nombre}`,
        }),
      );
  };

  it('Panadería abre el catálogo a pantalla completa en su pestaña, con el foco en ella y sus 6 productos', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir catálogo de Panadería' }));
    expect(tab('Panadería / Bollería')).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(tab('Panadería / Bollería')).toHaveFocus());
    expect(within(catalogo()).getByRole('tabpanel')).toBeInTheDocument();
    expect(within(catalogo()).getAllByRole('listitem')).toHaveLength(6);
    expect(
      within(catalogo()).getByText('Barra de pan rústica', {
        selector: 'span.font-bold',
      }),
    ).toBeInTheDocument();
    expect(
      within(catalogo()).getByText(/en cualquier producto para cambiar unidades/),
    ).toBeInTheDocument();
  });

  it('Fruta y verdura abre la pestaña Fruta; Fruta y Verdura son pestañas separadas con productos distintos', async () => {
    abrir('productos');
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir catálogo de Fruta y verdura' }),
    );
    expect(tab('Fruta')).toHaveAttribute('aria-selected', 'true');
    expect(
      within(catalogo()).getByText('Plátano de Canarias', {
        selector: 'span.font-bold',
      }),
    ).toBeInTheDocument();
    expect(
      within(catalogo()).queryByText('Lechuga romana', {
        selector: 'span.font-bold',
      }),
    ).not.toBeInTheDocument();
    await userEvent.click(tab('Verdura'));
    expect(tab('Verdura')).toHaveAttribute('aria-selected', 'true');
    expect(
      within(catalogo()).getByText('Lechuga romana', {
        selector: 'span.font-bold',
      }),
    ).toBeInTheDocument();
    expect(
      within(catalogo()).queryByText('Plátano de Canarias', {
        selector: 'span.font-bold',
      }),
    ).not.toBeInTheDocument();
    expect(within(catalogo()).queryByRole('button', { name: /Pesar/ })).not.toBeInTheDocument(); // todo por unidades
  });

  it('parte de lo que ya hay en la venta y no la cambia hasta guardar', async () => {
    abrir('productos'); // Pan de molde (1) ya está en la venta
    await userEvent.click(screen.getByRole('button', { name: 'Abrir catálogo de Panadería' }));
    expect(
      within(tarjeta('Pan de molde familiar')).getByText('En ticket: 1 ud'),
    ).toBeInTheDocument();
    await sumar('Croissant mantequilla', 2);
    expect(
      within(tarjeta('Croissant mantequilla')).getByText('En ticket: 2 ud'),
    ).toBeInTheDocument();
    expect(filasTrasElDialogo()).toHaveLength(4);
  });

  it('el resumen de la barra inferior cuenta productos, unidades e importe', async () => {
    abrir('vacia');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir catálogo de Panadería' }));
    expect(
      within(resumen()).getByText('0 productos seleccionados · 0 unidades totales'),
    ).toBeInTheDocument();
    await sumar('Croissant mantequilla', 2); // 2 × 1,20
    await sumar('Baguette tradicional'); // 0,95
    expect(
      within(resumen()).getByText('2 productos seleccionados · 3 unidades totales'),
    ).toBeInTheDocument();
    expect(
      within(resumen()).getByText('Importe total estimado: 3,35 €', {
        normalizer: (t) => t.replace(/\s/g, ' '),
      }),
    ).toBeInTheDocument();
  });

  it('«−» está desactivado con 0 unidades y funciona después', async () => {
    abrir('vacia');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir catálogo de Panadería' }));
    const menos = within(tarjeta('Croissant mantequilla')).getByRole('button', {
      name: 'Restar una unidad a Croissant mantequilla',
    });
    expect(menos).toBeDisabled();
    await sumar('Croissant mantequilla', 2);
    expect(menos).toBeEnabled();
    await userEvent.click(menos);
    expect(
      within(tarjeta('Croissant mantequilla')).getByText('En ticket: 1 ud'),
    ).toBeInTheDocument();
  });

  it('«Guardar productos e ir a la venta» añade lo elegido: lo nuevo primero y seleccionado, con el total actualizado', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir catálogo de Panadería' }));
    await sumar('Croissant mantequilla', 2); // 2 × 1,20 = 2,40
    await userEvent.click(
      within(catalogo()).getByRole('button', {
        name: /Guardar productos e ir a la venta/,
      }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(filas()).toHaveLength(5);
    expect(filas()[0]).toHaveAccessibleName(/Croissant mantequilla, 2 unidades/);
    expect(filas()[0]).toHaveAttribute('aria-current', 'true');
    expect(within(filas()[0]).getByText('Último añadido')).toBeInTheDocument();
    expect(total()).toBe('15,30 €'); // 12,90 + 2,40
  });

  it('con 0 unidades, un producto que estaba en la venta se quita al guardar', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir catálogo de Panadería' }));
    await userEvent.click(
      within(tarjeta('Pan de molde familiar')).getByRole('button', {
        name: 'Restar una unidad a Pan de molde familiar',
      }),
    );
    await userEvent.click(within(catalogo()).getByRole('button', { name: /Guardar productos/ }));
    expect(filas()).toHaveLength(3);
    expect(screen.queryByText('Pan de molde familiar')).not.toBeInTheDocument();
  });

  it('«Cancelar», «Volver a la venta» y Escape descartan lo elegido; el clic fuera no cierra', async () => {
    abrir('productos');
    const abrirYElegir = async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Abrir catálogo de Panadería' }));
      await sumar('Croissant mantequilla');
    };
    await abrirYElegir();
    await userEvent.click(document.body);
    expect(catalogo()).toBeInTheDocument();
    await userEvent.click(within(catalogo()).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await abrirYElegir();
    await userEvent.click(within(catalogo()).getByRole('button', { name: 'Volver a la venta' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await abrirYElegir();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(filas()).toHaveLength(4);
    expect(total()).toBe('12,90 €');
  });

  it('cambiar de pestaña conserva lo elegido en la otra', async () => {
    abrir('vacia');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir catálogo de Panadería' }));
    await sumar('Croissant mantequilla');
    await userEvent.click(tab('Verdura'));
    await sumar('Lechuga romana');
    await userEvent.click(within(catalogo()).getByRole('button', { name: /Guardar productos/ }));
    expect(filas()).toHaveLength(2);
    expect(filas()[0]).toHaveAccessibleName(/Lechuga romana/);
    expect(filas()[1]).toHaveAccessibleName(/Croissant mantequilla/);
  });

  it('?estado=catalogo', () => {
    abrir('catalogo');
    expect(catalogo()).toBeInTheDocument();
  });
});

describe('bolsa', () => {
  const bolsa = () => screen.getByRole('button', { name: /Añadir bolsa/ });

  it('«+ Bolsa» añade una bolsa directamente (sin menú), primera y seleccionada, con su insignia', async () => {
    abrir('productos');
    expect(within(bolsa()).queryByText(/^\d+$/)).not.toBeInTheDocument();
    await userEvent.click(bolsa());
    expect(filas()[0]).toHaveAccessibleName(/Bolsa, 1 unidad/);
    expect(filas()[0]).toHaveAttribute('aria-current', 'true');
    expect(total()).toBe('13,00 €'); // 12,90 + 0,10
    expect(bolsa()).toHaveAccessibleName('Añadir bolsa (1 en la venta)');
  });

  it('cada pulsación suma una; la insignia muestra cuántas hay; la lista vuelve a la bolsa', async () => {
    abrir('productos');
    await userEvent.click(bolsa());
    await userEvent.click(filas()[2]); // se revisa otro producto
    await userEvent.click(bolsa());
    await userEvent.click(bolsa());
    expect(filas()[0]).toHaveAccessibleName(/Bolsa, 3 unidades/);
    expect(bolsa()).toHaveAccessibleName('Añadir bolsa (3 en la venta)');
    expect(within(bolsa()).getByText('3')).toBeInTheDocument();
    expect(total()).toBe('13,20 €');
  });

  it('con una venta vacía empieza la venta con la bolsa', async () => {
    abrir('vacia');
    await userEvent.click(bolsa());
    expect(filas()).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Venta en curso' })).toBeInTheDocument();
  });

  it('con 999 bolsas avisa del límite y no añade más', async () => {
    abrir('vacia');
    await userEvent.click(bolsa());
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('999{Enter}');
    await userEvent.click(bolsa());
    expect(filas()[0]).toHaveAccessibleName(/Bolsa, 999 unidades/);
    expect(
      within(screen.getByRole('region', { name: 'Escáner' })).getByText('Límite de unidades'),
    ).toBeInTheDocument();
  });
});
