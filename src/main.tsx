import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { getFirebaseMessagingConfigForServiceWorker } from './services/pushNotificationsService';
import 'antd-mobile/es/global';
import './styles/global.css';

async function registerServiceWorker() {
  if (import.meta.env.DEV) {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const firebaseMessagingConfig = getFirebaseMessagingConfigForServiceWorker();
    const swUrl = firebaseMessagingConfig
      ? `/sw.js?firebaseConfig=${encodeURIComponent(JSON.stringify(firebaseMessagingConfig))}`
      : '/sw.js';
    const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
    await registration.update();
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
