import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd-mobile/es/global';
import './styles/global.css';

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    // O app continua funcionando sem SW quando o ambiente não permitir registro.
  }
}

window.addEventListener('load', () => {
  void registerServiceWorker();
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
