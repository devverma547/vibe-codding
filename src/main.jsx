import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';

// Global handler for Vite dynamic import preload failures (e.g. after new deployments)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite chunk preload error detected. Reloading page to fetch latest version...', event);
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);

