import { initializeApp, getApp, getApps } from 'firebase/app';
import { GoogleAuthProvider, browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasValidFirebaseConfig(config: typeof firebaseConfig) {
  return (
    typeof config.apiKey === 'string' &&
    config.apiKey.trim().length > 0 &&
    typeof config.authDomain === 'string' &&
    config.authDomain.trim().length > 0 &&
    typeof config.projectId === 'string' &&
    config.projectId.trim().length > 0 &&
    typeof config.appId === 'string' &&
    config.appId.trim().length > 0
  );
}

const app = hasValidFirebaseConfig(firebaseConfig)
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseReady = app !== null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export const googleAuthProvider = app ? new GoogleAuthProvider() : null;
if (googleAuthProvider) {
  googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
}

let persistenceReady = false;

export async function ensureAuthPersistence() {
  if (!auth) {
    return;
  }

  if (persistenceReady) {
    return;
  }

  await setPersistence(auth, browserLocalPersistence);
  persistenceReady = true;
}
