import { doc, setDoc } from 'firebase/firestore';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Unsubscribe,
} from 'firebase/messaging';
import { db, firebaseApp, firebaseReady, getFirebasePublicConfig } from '../firebase/client';
import { withTimeout } from './asyncTimeout';
import { isFirestoreUnavailableError, runFirestoreOperation } from './firestoreHealth';

type PushRegistrationResult = {
  token: string;
};

type PushPermissionStatus = 'default' | 'granted' | 'denied';

const USERS_COLLECTION = 'users';

function nowIso() {
  return new Date().toISOString();
}

function getVapidKey() {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();

  if (!vapidKey) {
    throw new Error('A chave VAPID das notificações não foi configurada.');
  }

  return vapidKey;
}

async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Este navegador não suporta service workers.');
  }

  const registration = await navigator.serviceWorker.getRegistration('/');

  if (!registration) {
    const readyRegistration = await withTimeout(
      navigator.serviceWorker.ready,
      5000,
      'Nenhum service worker ativo foi encontrado para este app.',
    );

    if (!readyRegistration) {
      throw new Error('Nenhum service worker ativo foi encontrado para este app.');
    }

    return readyRegistration;
  }

  return registration;
}

async function getMessagingInstance() {
  if (!firebaseReady || !firebaseApp) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const supported = await isSupported();
  if (!supported) {
    throw new Error('Seu navegador não suporta notificações push.');
  }

  return getMessaging(firebaseApp);
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (typeof Notification === 'undefined') {
    return 'denied';
  }

  return Notification.permission;
}

export async function enablePushNotifications(userId: string): Promise<PushRegistrationResult> {
  const messaging = await getMessagingInstance();
  const registration = await getServiceWorkerRegistration();
  const permission = await requestPushPermission();

  if (permission !== 'granted') {
    throw new Error('A permissão para notificações precisa estar liberada.');
  }

  const token = await withTimeout(
    getToken(messaging, {
      vapidKey: getVapidKey(),
      serviceWorkerRegistration: registration,
    }),
    15000,
    'Não foi possível gerar o token de notificações a tempo.',
  );

  if (!token) {
    throw new Error('Não foi possível gerar o token de notificações.');
  }

  if (!db) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  await runFirestoreOperation(
    setDoc(
      doc(db, USERS_COLLECTION, userId),
      {
        pushToken: token,
        pushNotificationsEnabled: true,
        pushTokenUpdatedAt: nowIso(),
      },
      { merge: true },
    ),
  );

  return { token };
}

export async function disablePushNotifications(userId: string) {
  if (!firebaseReady || !firebaseApp || !db) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const supported = await isSupported();
  if (supported) {
    const messaging = getMessaging(firebaseApp);
    await withTimeout(deleteToken(messaging), 8000, 'Não foi possível desativar as notificações a tempo.');
  }

  await runFirestoreOperation(
    withTimeout(
      setDoc(
        doc(db, USERS_COLLECTION, userId),
        {
          pushToken: '',
          pushNotificationsEnabled: false,
          pushTokenUpdatedAt: nowIso(),
        },
        { merge: true },
      ),
      12000,
      'A desativação das notificações demorou demais. Tente novamente.',
    ),
  );
}

export async function requestPushPermission() {
  if (typeof Notification === 'undefined') {
    throw new Error('Este navegador não suporta notificações.');
  }

  return Notification.requestPermission();
}

export async function subscribeToForegroundPushes(onMessagePayload: (payload: MessagePayload) => void): Promise<Unsubscribe> {
  if (!firebaseReady || !firebaseApp) {
    return () => undefined;
  }

  const supported = await isSupported();
  if (!supported) {
    return () => undefined;
  }

  const messaging = getMessaging(firebaseApp);
  return onMessage(messaging, onMessagePayload);
}

export function getPushNotificationErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return 'Não foi possível ativar as notificações.';
  }

  const code = 'code' in error ? String((error as { code?: string }).code) : '';

  if (code.includes('messaging/permission-blocked') || code.includes('permission-blocked')) {
    return 'O navegador bloqueou as notificações.';
  }

  if (code.includes('messaging/unsupported-browser')) {
    return 'Seu navegador não suporta notificações push.';
  }

  if (code.includes('messaging/token-subscribe-failed')) {
    return 'Não foi possível gerar o token de notificações.';
  }

  if (code.includes('messaging/invalid-registration-token')) {
    return 'O token de notificações está inválido. Tente ativar novamente.';
  }

  if (code.includes('messaging/permission-default')) {
    return 'Permita as notificações para concluir a ativação.';
  }

  if (String(error).includes('Nenhum service worker ativo foi encontrado')) {
    return 'Abra a versão publicada do app para ativar notificações. No ambiente local não há service worker ativo.';
  }

  if (String(error).includes('navegador não suporta service workers')) {
    return 'Seu navegador não suporta notificações push.';
  }

  if (String(error).includes('Firebase não está configurado')) {
    return 'Firebase indisponível neste ambiente.';
  }

  if (String(error).includes('demorou demais')) {
    return 'A operação de notificações demorou demais. Tente novamente.';
  }

  if (isFirestoreUnavailableError(error)) {
    return 'O Firestore ainda não foi criado neste projeto Firebase. Crie o banco padrão para continuar salvando dados.';
  }

  return 'Não foi possível ativar as notificações. Tente novamente.';
}

export function getFirebaseMessagingConfigForServiceWorker() {
  const config = getFirebasePublicConfig();

  if (
    !config.apiKey?.trim() ||
    !config.authDomain?.trim() ||
    !config.projectId?.trim() ||
    !config.messagingSenderId?.trim() ||
    !config.appId?.trim()
  ) {
    return null;
  }

  return {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  };
}
