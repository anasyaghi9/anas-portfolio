import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const container = document.getElementById('root');
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Pages built by scripts/prerender.js already contain their HTML. Reuse it when it was made for
// this address; 404.html is served for every unknown address, so it is rendered fresh instead.
function currentPath() {
  try {
    return decodeURI(window.location.pathname).replace(/\/+$/, '') || '/';
  } catch {
    return null; // Malformed address: never matches, so the page renders fresh.
  }
}

const here = currentPath();
if (container.dataset.prerendered === here) {
  hydrateRoot(container, app);
} else {
  container.textContent = '';
  createRoot(container).render(app);
}
