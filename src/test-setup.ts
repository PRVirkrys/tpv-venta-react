import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sin `globals`, Testing Library no limpia solo entre tests. También se restablece la URL (los tests usan `?estado=…`).
afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
});
