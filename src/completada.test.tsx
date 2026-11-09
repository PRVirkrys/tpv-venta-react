import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { abrir, filas, total } from './test-utils';

describe('venta completada y cuenta atrás', () => {
  const completada = () => screen.getByRole('dialog', { name: 'Venta completada' });
  /** Se abre como en el uso real (Cobrar → Efectivo): un diálogo que ya nace abierto no recibe el foco inicial. */
  async function cobrar(u: ReturnType<typeof userEvent.setup> = userEvent.setup()) {
    abrir('productos');
    await u.click(screen.getByRole('button', { name: /Cobrar/ }));
    await u.click(screen.getByRole('button', { name: 'Efectivo' }));
  }
  const segundos = () => within(completada()).getByText(/^[0-3]$/).textContent;

  /** Solo se simula lo que usa la cuenta atrás (setInterval y Date); lo demás sigue real para Base UI y userEvent. */
  async function conTiempoSimulado(
    prueba: (u: ReturnType<typeof userEvent.setup>) => Promise<void>,
  ) {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    try {
      await prueba(userEvent.setup());
    } finally {
      vi.useRealTimers();
    }
  }
  const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

  it('al cobrar, el foco pasa al título «Venta completada»', async () => {
    abrir('productos');
    await userEvent.click(screen.getByRole('button', { name: /Cobrar/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Efectivo' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Venta completada' })).toHaveFocus(),
    );
  });

  it('arranca en 3 s y no se puede cancelar con Escape ni con el clic fuera', async () => {
    await conTiempoSimulado(async (u) => {
      await cobrar(u);
      expect(segundos()).toBe('3');
      await u.keyboard('{Escape}');
      expect(completada()).toBeInTheDocument();
      await u.click(document.body);
      expect(completada()).toBeInTheDocument();
    });
  });

  it('cuenta atrás 3, 2, 1 y a los 3 s empieza una venta nueva vacía', async () => {
    await conTiempoSimulado(async (u) => {
      await cobrar(u);
      pasar(1100);
      expect(segundos()).toBe('2');
      pasar(1000);
      expect(segundos()).toBe('1');
      pasar(1000);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Nueva venta' })).toBeInTheDocument();
      expect(total()).toBe('0,00 €');
    });
  });

  it('un nuevo render durante la cuenta no la reinicia ni la alarga', async () => {
    await conTiempoSimulado(async (u) => {
      await cobrar(u);
      pasar(1500);
      // cualquier cambio en el padre vuelve a renderizar el diálogo
      await u.keyboard('r');
      await u.keyboard('n');
      pasar(1600); // 3,1 s en total desde que se abrió
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('un escaneo antes de acabar la cuenta empieza la venta nueva con ese producto y para el contador', async () => {
    await conTiempoSimulado(async (u) => {
      await cobrar(u);
      pasar(1000);
      await u.keyboard('e');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(filas()).toHaveLength(1);
      expect(filas()[0]).toHaveAttribute('aria-current', 'true');
      pasar(5000); // el contador ya no debe borrar la venta nueva
      expect(filas()).toHaveLength(1);
    });
  });

  it('R y N (códigos que no se pueden leer) no hacen nada durante la venta completada', async () => {
    await conTiempoSimulado(async (u) => {
      await cobrar(u);
      await u.keyboard('r');
      await u.keyboard('n');
      expect(completada()).toBeInTheDocument();
    });
  });

  it('al cobrar de verdad se llega a la venta completada y se vuelve a empezar', async () => {
    await conTiempoSimulado(async (u) => {
      abrir('productos');
      await u.click(screen.getByRole('button', { name: /Cobrar/ }));
      await u.click(screen.getByRole('button', { name: 'Efectivo' }));
      expect(completada()).toBeInTheDocument();
      pasar(3100);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Nueva venta' })).toBeInTheDocument();
    });
  });
});
