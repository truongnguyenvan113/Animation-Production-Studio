// Ensure window.fetch has a setter if an environment or extension attempts direct assignment
if (typeof window !== 'undefined' && window.fetch) {
  try {
    const origFetch = window.fetch.bind(window);
    let activeFetch = origFetch;
    Object.defineProperty(window, 'fetch', {
      get() {
        return activeFetch;
      },
      set(fn) {
        activeFetch = typeof fn === 'function' ? fn.bind(window) : fn;
      },
      configurable: true,
      enumerable: true,
    });
  } catch {
    // Ignore if already configured
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
