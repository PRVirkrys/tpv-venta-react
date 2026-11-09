import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { abrir } from './test-utils';

/**
 * Estados de los botones: hover suave para quien use ratón (la pantalla es táctil, pero también admite puntero) y
 * respuesta marcada al pulsar, con los colores de los tokens aprobados. jsdom no calcula estilos, así que se comprueban las clases; los colores reales
 * de cada estado se verificaron en el navegador y los pares de texto se miden en `contraste.test.ts`.
 */
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe('hover', () => {
  it('toda clase hover: va acompañada de su estado pulsado, que es el que manda al pulsar', () => {
    const sinPulsado = archivos(import.meta.dirname)
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
      .filter((f) => {
        const texto = readFileSync(f, 'utf8');
        return /(?<![a-z-])hover:bg-/.test(texto) && !/active:bg-/.test(texto);
      });
    expect(sinPulsado).toEqual([]);
  });

  it.each([
    [/Cobrar/, 'hover:bg-primary-hover'],
    [/Descartar venta/, 'hover:bg-error-hover'],
    ['Código manual', 'hover:bg-surface-hover'],
  ])('«%s» tiene respuesta al pasar el ratón', (nombre, clase) => {
    abrir('productos');
    expect(screen.getAllByRole('button', { name: nombre })[0].className).toContain(clase);
  });
});

describe('estado pulsado de los botones', () => {
  const clases = (nombre: string | RegExp) =>
    screen.getByRole('button', { name: nombre }).className;

  it('Cobrar (principal): fondo terracota oscuro al pulsar', () => {
    abrir('productos');
    expect(clases(/Cobrar/)).toContain('active:bg-primary-pressed');
  });

  it('Descartar venta y Quitar de la venta (peligro suave): fondo rojo claro y texto rojo oscuro al pulsar, rojo en reposo', () => {
    abrir('productos');
    for (const nombre of [/Descartar venta/, /Quitar de la venta/]) {
      expect(clases(nombre)).toContain('text-error-ink');
      expect(clases(nombre)).toContain('active:bg-error-press');
      expect(clases(nombre)).toContain('active:text-error-pressed');
    }
  });

  it.each(['Código manual', 'Otra cantidad', 'Abrir catálogo de Panadería', 'Añadir una unidad'])(
    'el control neutro «%s» se oscurece un paso al pulsar',
    (nombre) => {
      abrir('productos');
      const boton = screen.getAllByRole('button', { name: nombre })[0];
      expect(boton.className).toContain('active:bg-surface-pressed');
    },
  );

  it('el botón de peligro de los diálogos se oscurece al pulsar', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: /Descartar venta/ }));
    const confirmar = within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Descartar venta',
    });
    expect(confirmar.className).toContain('bg-error-solid');
    expect(confirmar.className).toContain('active:bg-error-pressed');
  });

  it('el botón principal de los diálogos usa el mismo estado pulsado que Cobrar', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: 'Otra cantidad' }));
    await userEvent.keyboard('5');
    await userEvent.click(screen.getByRole('button', { name: /Cobrar/ }));
    const guardar = within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Guardar y continuar',
    });
    expect(guardar.className).toContain('active:bg-primary-pressed');
  });

  it('las opciones de pago se aclaran un paso al pulsar', async () => {
    abrir('productos');
    await userEvent.keyboard('{F8}');
    expect(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Efectivo',
      }).className,
    ).toContain('active:bg-surface-subtle');
  });

  it('la pestaña activa del catálogo no cambia de color al pulsarla', async () => {
    abrir('catalogo');
    const activa = within(screen.getByRole('dialog')).getByRole('tab', {
      selected: true,
    });
    expect(activa.className).toContain('bg-ink');
    expect(activa.className).toContain('active:bg-ink');
  });

  it('un botón desactivado no responde (Cobrar con la venta vacía)', () => {
    abrir('vacia');
    const cobrar = screen.getByRole('button', { name: /Cobrar/ });
    expect(cobrar).toBeDisabled();
    expect(cobrar.className).toContain('disabled:pointer-events-none');
  });

  it('el botón base no se mueve ni crece al pulsar (sin translate ni sombra)', () => {
    const base = readFileSync(join(import.meta.dirname, 'components/ui/button.tsx'), 'utf8');
    expect(base).not.toMatch(/translate-y|scale-|shadow/);
  });
});
