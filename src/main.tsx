import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Progressive Web App (PWA) Service Worker
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        console.log('RatDoku PWA ServiceWorker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('RatDoku PWA ServiceWorker registration failed:', error);
      });
  });
}

