import axe from 'axe-core';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { abrir, filas } from './test-utils';

const guia = () => screen.queryByRole('dialog', { name: 'Guía para revisar la prueba' });

describe('guía de revisión (solo con VITE_GUIA_REVISION=1)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('no aparece sin la variable', () => {
    abrir();
    expect(guia()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Guía de prueba/ })).not.toBeInTheDocument();
  });

  it('aparece al abrir con la variable y el foco va a «Empezar a probar»', async () => {
    vi.stubEnv('VITE_GUIA_REVISION', '1');
    abrir();
    expect(guia()).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Empezar a probar' })).toHaveFocus(),
    );
  });

  it('sin violaciones de axe-core (el contraste se mide en contraste.test.ts)', async () => {
    vi.stubEnv('VITE_GUIA_REVISION', '1');
    abrir();
    const { violations } = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('atrapa el foco: Tab no sale de la guía', async () => {
    vi.stubEnv('VITE_GUIA_REVISION', '1');
    abrir();
    const dialogo = guia()!;
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Empezar a probar' })).toHaveFocus(),
    );
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    // Base UI atrapa el foco con guardianes que lo devuelven al diálogo un instante después.
    await waitFor(() => expect(dialogo).toContainElement(document.activeElement as HTMLElement));
    expect(document.activeElement).not.toHaveAttribute('data-base-ui-focus-guard');
  });

  it('Esc la cierra y el foco vuelve al estado del escáner', async () => {
    vi.stubEnv('VITE_GUIA_REVISION', '1');
    abrir();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(guia()).not.toBeInTheDocument());
    await waitFor(() => expect(document.getElementById('foco-escaner')).toHaveFocus());
  });

  it('con la guía abierta las teclas de venta no hacen nada', async () => {
    vi.stubEnv('VITE_GUIA_REVISION', '1');
    abrir();
    await userEvent.keyboard('enr{F2}{F4}{F8}');
    expect(guia()).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Empezar a probar' }));
    await waitFor(() => expect(guia()).not.toBeInTheDocument());
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    // Cerrada, E vuelve a añadir productos.
    await userEvent.keyboard('e');
    expect(filas()).toHaveLength(1);
  });

  it('el botón «Guía de prueba» la vuelve a abrir', async () => {
    vi.stubEnv('VITE_GUIA_REVISION', '1');
    abrir();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(guia()).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Guía de prueba/ }));
    expect(guia()).toBeInTheDocument();
  });

  it('no se abre sola sobre un estado de comprobación', () => {
    vi.stubEnv('VITE_GUIA_REVISION', '1');
    abrir('pago');
    expect(guia()).not.toBeInTheDocument();
  });
});
