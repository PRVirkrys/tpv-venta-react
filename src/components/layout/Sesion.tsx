import logo from '@/assets/logo.svg';

export function Marca() {
  return (
    <img src={logo} alt="Logo" className="h-9 w-auto rounded-md bg-brand-brown" />
  );
}

export function SesionCajero() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-subtle px-4 py-1.5 text-body text-ink-muted">
      <span aria-hidden className="size-2 rounded-full bg-success-solid" />
      Cajero: <b className="font-bold text-ink">Barry Allen</b>
      <i aria-hidden className="not-italic text-ink-disabled">
        ·
      </i>
      Caja: <b className="font-bold text-ink">04</b>
    </span>
  );
}
