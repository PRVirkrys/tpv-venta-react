import axe from 'axe-core';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrir, filas } from './test-utils';

const guia = () => screen.queryByRole('dialog', { name: 'Guía para revisar la prueba' });
const pista = () => screen.queryByRole('note');
const boton = (nombre: string | RegExp) => screen.getByRole('button', { name: nombre });

/** Abre la demo con la variable y cierra la intro con «Saltar». */
async function abrirDemo() {
  abrir();
  await userEvent.click(boton('Saltar'));
  await waitFor(() => expect(guia()).not.toBeInTheDocument());
}

describe('sin VITE_GUIA_REVISION (npm run dev / build normales)', () => {
  it('no hay intro, pistas ni pantalla completa, y Opciones no ofrece la guía', async () => {
    abrir();
    expect(guia()).not.toBeInTheDocument();
    expect(pista()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pantalla completa/ })).not.toBeInTheDocument();
    await userEvent.click(boton('Opciones'));
    expect(screen.queryByRole('button', { name: 'Ver guía otra vez' })).not.toBeInTheDocument();
  });
});

describe('intro de la demo (VITE_GUIA_REVISION=1)', () => {
  beforeEach(() => vi.stubEnv('VITE_GUIA_REVISION', '1'));
  afterEach(() => vi.unstubAllEnvs());

  it('aparece al abrir, en tres pasos, con el foco en «Siguiente»', async () => {
    abrir();
    const dialogo = guia()!;
    expect(dialogo).toBeInTheDocument();
    await waitFor(() => expect(boton('Siguiente')).toHaveFocus());
    expect(within(dialogo).getByRole('heading', { name: 'Añadir productos' })).toBeInTheDocument();
    expect(within(dialogo).getByText('Paso 1 de 3')).toBeInTheDocument();

    await userEvent.click(boton('Siguiente'));
    expect(
      within(dialogo).getByRole('heading', { name: 'Cambiar la cantidad' }),
    ).toBeInTheDocument();
    await userEvent.click(boton('Siguiente'));
    expect(
      within(dialogo).getByRole('heading', { name: 'Si falla la lectura' }),
    ).toBeInTheDocument();
    // En el último paso ya no hay «Saltar»: el botón principal la cierra.
    expect(within(dialogo).queryByRole('button', { name: 'Saltar' })).not.toBeInTheDocument();
    await userEvent.click(boton('Empezar a probar'));
    await waitFor(() => expect(guia()).not.toBeInTheDocument());
  });

  it('sin violaciones de axe-core (el contraste se mide en contraste.test.ts)', async () => {
    abrir();
    const { violations } = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('atrapa el foco: Tab no sale de la guía', async () => {
    abrir();
    const dialogo = guia()!;
    await waitFor(() => expect(boton('Siguiente')).toHaveFocus());
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    // Base UI atrapa el foco con guardianes que lo devuelven al diálogo un instante después.
    await waitFor(() => expect(dialogo).toContainElement(document.activeElement as HTMLElement));
    expect(document.activeElement).not.toHaveAttribute('data-base-ui-focus-guard');
  });

  it('Esc la cierra y el foco vuelve al estado del escáner', async () => {
    abrir();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(guia()).not.toBeInTheDocument());
    await waitFor(() => expect(document.getElementById('foco-escaner')).toHaveFocus());
  });

  it('con la intro abierta las teclas de venta no hacen nada', async () => {
    abrir();
    await userEvent.keyboard('enr{F2}{F4}{F8}');
    expect(guia()).toBeInTheDocument();
    await userEvent.click(boton('Saltar'));
    await waitFor(() => expect(guia()).not.toBeInTheDocument());
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    // Cerrada, E vuelve a añadir productos.
    await userEvent.keyboard('e');
    expect(filas()).toHaveLength(1);
  });

  it('Opciones, Ver guía otra vez, la vuelve a abrir desde el primer paso', async () => {
    await abrirDemo();
    await userEvent.click(boton('Opciones'));
    await userEvent.click(boton('Ver guía otra vez'));
    expect(within(guia()!).getByText('Paso 1 de 3')).toBeInTheDocument();
  });

  it('no se abre sola sobre un estado de comprobación', () => {
    abrir('pago');
    expect(guia()).not.toBeInTheDocument();
  });
});

describe('pistas en contexto (VITE_GUIA_REVISION=1)', () => {
  beforeEach(() => vi.stubEnv('VITE_GUIA_REVISION', '1'));
  afterEach(() => vi.unstubAllEnvs());

  it('no aparecen mientras la intro está abierta', () => {
    abrir();
    expect(pista()).not.toBeInTheDocument();
  });

  it('acompañan cada paso, una vez, sin quitar el foco ni bloquear las teclas', async () => {
    await abrirDemo();
    // Venta vacía: cómo añadir productos, junto al escáner.
    expect(pista()).toHaveAccessibleName('Pista: Añadir productos');
    await waitFor(() => expect(document.getElementById('foco-escaner')).toHaveFocus());

    // Tras escanear: cómo cambiar la cantidad. La tecla E sigue funcionando con la pista visible.
    await userEvent.keyboard('e');
    expect(filas()).toHaveLength(1);
    expect(pista()).toHaveAccessibleName('Pista: Cambiar la cantidad');
    expect(screen.getByTestId('resaltado-pista')).toBeInTheDocument();

    // Tocar el número abre el teclado numérico y la pista pasa a explicarlo.
    await userEvent.click(screen.getByRole('button', { name: /^Editar cantidad de/ }));
    expect(pista()).toHaveAccessibleName('Pista: Teclado de cantidad');
    await userEvent.keyboard('{Escape}');

    // Ya vistas, no se repiten: con un solo producto no queda ninguna.
    await waitFor(() => expect(pista()).not.toBeInTheDocument());

    // Con dos productos, la última: cómo cerrar la venta.
    await userEvent.keyboard('e');
    expect(pista()).toHaveAccessibleName('Pista: Cerrar la venta');
  });

  it('una lectura fallida (R) muestra qué hacer en la entrada manual', async () => {
    await abrirDemo();
    await userEvent.keyboard('r');
    expect(pista()).toHaveAccessibleName('Pista: Si falla la lectura');
  });

  it('«Entendido» la cierra y no vuelve', async () => {
    await abrirDemo();
    await userEvent.click(within(pista()!).getByRole('button', { name: 'Entendido' }));
    expect(pista()).not.toBeInTheDocument();
  });

  it('Ver guía otra vez reinicia las pistas', async () => {
    await abrirDemo();
    await userEvent.click(within(pista()!).getByRole('button', { name: 'Entendido' }));
    await userEvent.click(boton('Opciones'));
    await userEvent.click(boton('Ver guía otra vez'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(guia()).not.toBeInTheDocument());
    expect(pista()).toHaveAccessibleName('Pista: Añadir productos');
  });
});

describe('pantalla completa (VITE_GUIA_REVISION=1)', () => {
  beforeEach(() => vi.stubEnv('VITE_GUIA_REVISION', '1'));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('usa la pantalla completa del navegador cuando está disponible', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    const entrar = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = entrar;
    await abrirDemo();
    await userEvent.click(boton(/Pantalla completa/));
    expect(entrar).toHaveBeenCalled();
  });

  it('si no está disponible, abre la demo en una ventana nueva', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: false, configurable: true });
    const abrirVentana = vi.spyOn(window, 'open').mockReturnValue(null);
    await abrirDemo();
    await userEvent.click(boton(/Pantalla completa/));
    expect(abrirVentana).toHaveBeenCalledWith(
      location.href,
      '_blank',
      expect.stringContaining('width=1366'),
    );
  });

  it('en una ventana menor que 1024 × 768 escala la pantalla para que quepa y lo indica', async () => {
    const ancho = innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
    try {
      await abrirDemo();
      expect(document.querySelector('main')!.parentElement!.style.transform).toBe('scale(0.78125)');
      expect(boton(/Pantalla completa/)).toHaveTextContent('Vista reducida');
    } finally {
      Object.defineProperty(window, 'innerWidth', { value: ancho, configurable: true });
    }
  });
});
