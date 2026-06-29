import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
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

function providerForUser(user: FirebaseUser) {
  return user.providerData.some((provider) => provider.providerId === 'password') ? 'email' : 'google';
}

function buildAuthSession(
  user: FirebaseUser,
  existingUser?: Record<string, unknown> | null,
  timestamp = nowIso(),
  provider: AuthSession['provider'] = providerForUser(user),
): AuthSession {
  return {
    id: user.uid,
    name: (existingUser?.name as string | undefined) || displayNameFor(user),
    email: (existingUser?.email as string | undefined) || user.email?.trim() || '',
    provider,
    businessId: (existingUser?.businessId as string | undefined) || user.uid,
    businessName:
      (existingUser?.businessName as string | undefined) ||
      `${displayNameFor(user)} Studio`,
    role: (existingUser?.role as UserRole | undefined) || 'owner',
    photoURL: user.photoURL || undefined,
    createdAt: (existingUser?.createdAt as string | undefined) || timestamp,
  };
}

async function syncUserDocuments(user: FirebaseUser, provider: AuthSession['provider'] = providerForUser(user)) {
  if (!firebaseReady || !auth || !db) {
    return buildAuthSession(user, null, nowIso(), provider);
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
  return buildAuthSession(user, sessionData, timestamp, provider);
}

function shouldFallbackToRedirect(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? String((error as { code?: string }).code) : '';

  return (
    code.includes('auth/popup-blocked') ||
    code.includes('auth/popup-closed-by-user') ||
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
    const session = buildAuthSession(credential.user, null, nowIso(), 'google');
    void syncUserDocuments(credential.user, 'google').catch(() => undefined);
    return { mode: 'popup' as const, session };
  } catch (error) {
    if (!shouldFallbackToRedirect(error)) {
      throw error;
    }

    await signInWithRedirect(auth, googleAuthProvider);
    return { mode: 'redirect' as const };
  }
}

export async function signInWithEmail(email: string, password: string) {
  if (!firebaseReady || !auth) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  await ensureAuthPersistence();

  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const session = buildAuthSession(credential.user, null, nowIso(), 'email');
  void syncUserDocuments(credential.user, 'email').catch(() => undefined);
  return session;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  if (!firebaseReady || !auth) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  await ensureAuthPersistence();

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const trimmedName = name.trim();

  if (trimmedName) {
    await updateProfile(credential.user, { displayName: trimmedName });
  }

  const session = buildAuthSession(
    credential.user,
    trimmedName ? { name: trimmedName } : null,
    nowIso(),
    'email',
  );
  void syncUserDocuments(credential.user, 'email').catch(() => undefined);
  return session;
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

  if (code.includes('auth/popup-closed-by-user')) {
    return 'O login com Google foi cancelado.';
  }

  if (code.includes('auth/popup-blocked')) {
    return 'O navegador bloqueou o popup do Google.';
  }

  if (code.includes('account-exists-with-different-credential')) {
    return 'Esse e-mail já existe com outro método de login.';
  }

  if (code.includes('auth/unauthorized-domain')) {
    return 'Este domínio não está autorizado no Firebase. Verifique a lista de domínios permitidos.';
  }

  if (code.includes('auth/api-key-not-valid') || code.includes('auth/invalid-api-key')) {
    return 'A configuração do Firebase está inválida neste ambiente.';
  }

  if (code.includes('auth/operation-not-allowed')) {
    return 'O login com Google não está habilitado neste projeto Firebase.';
  }

  if (code.includes('auth/network-request-failed')) {
    return 'Falha de rede ao tentar autenticar. Tente novamente.';
  }

  if (code.includes('auth/invalid-email')) {
    return 'O e-mail informado não é válido.';
  }

  if (code.includes('auth/user-not-found')) {
    return 'Não encontramos uma conta com esse e-mail.';
  }

  if (code.includes('auth/wrong-password')) {
    return 'A senha informada está incorreta.';
  }

  if (code.includes('auth/email-already-in-use')) {
    return 'Já existe uma conta com esse e-mail.';
  }

  if (code.includes('auth/weak-password')) {
    return 'Use uma senha com pelo menos 6 caracteres.';
  }

  if (code.includes('auth/too-many-requests')) {
    return 'Muitas tentativas. Tente novamente em instantes.';
  }

  return 'Não foi possível autenticar agora. Tente novamente.';
}
