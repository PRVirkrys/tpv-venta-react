import axe from 'axe-core';
import indexHtml from '../index.html?raw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { abrir } from './test-utils';

/**
 * Reglas de axe-core sobre el DOM de cada estado. El contraste de color no se puede medir en jsdom
 * (no calcula estilos): se comprueba aparte en `contraste.test.ts`.
 */
async function violaciones() {
  const resultado = await axe.run(document.body, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return resultado.violations.map(
    (v) => `${v.id}: ${v.help} en ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  );
}

const estados = [
  'vacia',
  'productos',
  'seleccion',
  'maximo',
  'nombre-largo',
  'lista-larga',
  'lectura-error',
  'codigo-error',
  'codigo-manual',
  'codigo-manual-error',
  'editar',
  'cantidad-error',
  'atajos',
];

describe('accesibilidad (axe-core)', () => {
  it.each(estados)('estado «%s» sin violaciones', async (estado) => {
    abrir(estado);
    expect(await violaciones()).toEqual([]);
  });

  it.each([
    ['borrar', 'alertdialog'],
    ['descarte', 'alertdialog'],
    ['cantidad-pendiente', 'alertdialog'],
    ['pago', 'dialog'],
    ['completada', 'dialog'],
    ['catalogo', 'dialog'],
  ])('diálogo «%s» sin violaciones', async (estado, rol) => {
    abrir(estado);
    await waitFor(() => expect(screen.getByRole(rol)).toBeInTheDocument());
    expect(await violaciones()).toEqual([]);
  });

  it('el catálogo con la pestaña de verdura y lo elegido, sin violaciones', async () => {
    abrir('catalogo');
    const catalogo = screen.getByRole('dialog', { name: 'Catálogo rápido' });
    await userEvent.click(within(catalogo).getByRole('tab', { name: 'Verdura' }));
    await userEvent.click(
      within(catalogo).getByRole('button', {
        name: /Añadir una unidad a Lechuga romana/,
      }),
    );
    expect(await violaciones()).toEqual([]);
  });
});

describe('estructura y nombres accesibles', () => {
  it('tiene un único h1, regiones con nombre y los botones sin texto tienen etiqueta', () => {
    abrir('productos');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    for (const nombre of [
      'Venta en curso',
      'Escáner',
      'Producto seleccionado',
      'Accesos rápidos',
    ]) {
      expect(screen.getByRole('region', { name: nombre })).toBeInTheDocument();
    }
    for (const boton of screen.getAllByRole('button')) {
      expect(boton, boton.outerHTML.slice(0, 80)).toHaveAccessibleName();
    }
  });

  it('la fila seleccionada se anuncia con aria-current y el aviso del escáner es una región de estado', () => {
    abrir('productos');
    expect(
      screen.getAllByRole('listitem').filter((f) => f.getAttribute('aria-current') === 'true'),
    ).toHaveLength(1);
    expect(
      within(screen.getByRole('region', { name: 'Escáner' })).getByRole('status'),
    ).toHaveTextContent('Escáner listo');
  });

  it('los errores de campo se anuncian (role=alert) y el campo queda marcado como inválido y enlazado al mensaje', () => {
    abrir('codigo-manual-error');
    const manual = screen.getByRole('region', {
      name: 'Introducir código manual',
    });
    const campo = within(manual).getByRole('textbox');
    const alerta = within(manual).getByRole('alert');
    expect(campo).toBeInvalid();
    expect(campo).toHaveAccessibleDescription(alerta.textContent!);
  });

  it('el interruptor de atajos es un switch con estado', () => {
    abrir('atajos');
    expect(screen.getByRole('switch', { name: 'Mostrar atajos de teclado' })).toBeChecked();
  });

  it('la página declara el idioma español y tiene un título propio (index.html)', () => {
    expect(indexHtml).toMatch(/<html lang="es">/);
    expect(indexHtml).toMatch(/<title>TPV · Venta de caja<\/title>/);
  });

  it('las pestañas del catálogo controlan su panel y el panel se nombra por la pestaña activa', async () => {
    abrir('catalogo');
    const catalogo = screen.getByRole('dialog', { name: 'Catálogo rápido' });
    await userEvent.click(within(catalogo).getByRole('tab', { name: 'Verdura' }));
    const panel = within(catalogo).getByRole('tabpanel', { name: 'Verdura' });
    expect(within(catalogo).getByRole('tab', { name: 'Verdura' })).toHaveAttribute(
      'aria-controls',
      panel.id,
    );
    expect(within(panel).getAllByRole('listitem')).toHaveLength(5);
  });
});
