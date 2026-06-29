import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, ensureAuthPersistence, firebaseReady, googleAuthProvider } from '../firebase/client';
import type { AuthSession, UserRole } from '../types/domain';

const USERS_COLLECTION = 'users';
const BUSINESSES_COLLECTION = 'businesses';

function nowIso() {
  return new Date().toISOString();
}

function displayNameFor(user: FirebaseUser) {
  return user.displayName?.trim() || user.email?.split('@')[0]?.trim() || 'Usuário';
}

function buildAuthSession(user: FirebaseUser, existingUser?: Record<string, unknown> | null, timestamp = nowIso()): AuthSession {
  return {
    id: user.uid,
    name: (existingUser?.name as string | undefined) || displayNameFor(user),
    email: (existingUser?.email as string | undefined) || user.email?.trim() || '',
    provider: 'google',
    businessId: (existingUser?.businessId as string | undefined) || user.uid,
    businessName:
      (existingUser?.businessName as string | undefined) ||
      `${displayNameFor(user)} Studio`,
    role: (existingUser?.role as UserRole | undefined) || 'owner',
    photoURL: user.photoURL || undefined,
    createdAt: (existingUser?.createdAt as string | undefined) || timestamp,
  };
}

async function syncUserDocuments(user: FirebaseUser) {
  if (!firebaseReady || !auth || !db) {
    return buildAuthSession(user);
  }

  const timestamp = nowIso();
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userSnapshot = await getDoc(userRef);
  const existingUser = userSnapshot.exists() ? userSnapshot.data() : null;
  const businessId = (existingUser?.businessId as string | undefined) || user.uid;
  const businessRef = doc(db, BUSINESSES_COLLECTION, businessId);
  const businessSnapshot = await getDoc(businessRef);
  const businessName =
    (businessSnapshot.exists() ? (businessSnapshot.data().name as string | undefined) : undefined) ||
    `${displayNameFor(user)} Studio`;

  if (!businessSnapshot.exists()) {
    await setDoc(businessRef, {
      id: businessId,
      name: businessName,
      ownerId: user.uid,
      segment: 'Serviços',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  if (!userSnapshot.exists()) {
    await setDoc(userRef, {
      id: user.uid,
      name: displayNameFor(user),
      email: user.email?.trim() || '',
      businessId,
      role: 'owner' satisfies UserRole,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } else {
    await setDoc(
      userRef,
      {
        ...existingUser,
        id: user.uid,
        name: (existingUser?.name as string | undefined) || displayNameFor(user),
        email: (existingUser?.email as string | undefined) || user.email?.trim() || '',
        businessId,
        updatedAt: timestamp,
      },
      { merge: true },
    );
  }

  const sessionData = existingUser ? { ...existingUser, businessId, businessName } : { businessId, businessName };
  return buildAuthSession(user, sessionData, timestamp);
}

function shouldFallbackToRedirect(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? String((error as { code?: string }).code) : '';

  return (
    code.includes('auth/popup-blocked') ||
    code.includes('auth/operation-not-supported-in-this-environment') ||
    code.includes('auth/web-storage-unsupported')
  );
}

export function listenToAuthSession(onChange: (session: AuthSession | null) => void) {
  if (!firebaseReady || !auth || !db) {
    onChange(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onChange(null);
      return;
    }

    const session = buildAuthSession(user);
    onChange(session);

    void syncUserDocuments(user).catch(() => undefined);
  });
}

export async function signInWithGoogle() {
  if (!firebaseReady || !auth || !googleAuthProvider) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  await ensureAuthPersistence();

  try {
    const credential = await signInWithPopup(auth, googleAuthProvider);
    const session = buildAuthSession(credential.user);
    void syncUserDocuments(credential.user).catch(() => undefined);
    return { mode: 'popup' as const, session };
  } catch (error) {
    if (!shouldFallbackToRedirect(error)) {
      throw error;
    }

    await signInWithRedirect(auth, googleAuthProvider);
    return { mode: 'redirect' as const };
  }
}

export async function signOut() {
  if (!firebaseReady || !auth) {
    return;
  }

  await firebaseSignOut(auth);
}

export function getAuthErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return 'Não foi possível autenticar agora.';
  }

  const code = 'code' in error ? String((error as { code?: string }).code) : '';

  if (code.includes('popup-closed-by-user')) {
    return 'O login com Google foi cancelado.';
  }

  if (code.includes('auth/popup-blocked')) {
    return 'O navegador bloqueou o popup do Google.';
  }

  if (code.includes('account-exists-with-different-credential')) {
    return 'Esse e-mail já existe com outro método de login.';
  }

  if (code.includes('invalid-api-key')) {
    return 'A configuração do Firebase está inválida neste ambiente.';
  }

  return 'Não foi possível entrar com Google. Tente novamente.';
}
