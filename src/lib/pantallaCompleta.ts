/** En tablets el navegador no permite entrar solo en pantalla completa: hace falta un gesto. El primer toque la activa. */
export function activarPantallaCompletaAlTocar() {
  const tactil = window.matchMedia('(pointer: coarse)').matches;
  const yaEnApp = window.matchMedia(
    '(display-mode: fullscreen), (display-mode: standalone)',
  ).matches;
  if (!tactil || yaEnApp || !document.fullscreenEnabled) return;

  const entrar = () => {
    if (document.fullscreenElement) return;
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  };
  // Si la persona sale de pantalla completa, el siguiente toque la vuelve a activar.
  document.addEventListener('pointerup', entrar);
}
