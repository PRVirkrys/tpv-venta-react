import { Banknote, CreditCard } from 'lucide-react';
import type { MetodoPago } from '@/domain/tpv';

export const NOMBRE_PAGO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
};
export const ICONO_PAGO = { efectivo: Banknote, tarjeta: CreditCard } as const;
