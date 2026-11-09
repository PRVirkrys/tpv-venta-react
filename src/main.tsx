import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { activarPantallaCompletaAlTocar } from './lib/pantallaCompleta';

// Solo para pruebas en tablet; no forma parte del producto. Se sale con ESC (teclado externo) o el botón atrás.
activarPantallaCompletaAlTocar();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
