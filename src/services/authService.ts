import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { auth, db, ensureAuthPersistence, firebaseReady, googleAuthProvider } from '../firebase/client';
import {
  isFirestoreUnavailable,
  isFirestoreUnavailableError,
  markFirestoreUnavailable,
  runFirestoreOperation,
} from './firestoreHealth';
import { normalizeFirestoreId } from './firestoreIds';
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
  existingBusiness?: Record<string, unknown> | null,
  timestamp = nowIso(),
  provider: AuthSession['provider'] = providerForUser(user),
): AuthSession {
  const businessId = normalizeFirestoreId(
    (existingUser?.businessId as string | undefined) ||
      (existingBusiness?.id as string | undefined) ||
      user.uid,
    user.uid,
  );

  return {
    id: normalizeFirestoreId(user.uid, user.uid),
    name: (existingUser?.name as string | undefined) || displayNameFor(user),
    email: (existingUser?.email as string | undefined) || user.email?.trim() || '',
    provider,
    businessId,
    businessName:
      (existingBusiness?.name as string | undefined) ||
      (existingUser?.businessName as string | undefined) ||
      `${displayNameFor(user)} Studio`,
    role: (existingUser?.role as UserRole | undefined) || 'owner',
    photoURL: user.photoURL || undefined,
    createdAt: (existingUser?.createdAt as string | undefined) || timestamp,
  };
}

async function syncUserDocuments(user: FirebaseUser, provider: AuthSession['provider'] = providerForUser(user)) {
  const firestore = db;

  if (!firebaseReady || !auth || !firestore || isFirestoreUnavailable()) {
    return buildAuthSession(user, null, null, nowIso(), provider);
  }

  const timestamp = nowIso();
  const userId = normalizeFirestoreId(user.uid, user.uid);
  const userRef = doc(firestore, USERS_COLLECTION, userId);
  const userSnapshot = await runFirestoreOperation(getDoc(userRef));
  const existingUser = userSnapshot.exists() ? userSnapshot.data() : null;
  const businessId = normalizeFirestoreId((existingUser?.businessId as string | undefined) || user.uid, userId);
  const businessRef = doc(firestore, BUSINESSES_COLLECTION, businessId);
  const businessSnapshot = await runFirestoreOperation(getDoc(businessRef));
  const businessName =
    (businessSnapshot.exists() ? (businessSnapshot.data().name as string | undefined) : undefined) ||
    `${displayNameFor(user)} Studio`;

  if (!businessSnapshot.exists()) {
    await runFirestoreOperation(
      setDoc(businessRef, {
        id: businessId,
        name: businessName,
        ownerId: userId,
        segment: 'Serviços',
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );
  }

  if (!userSnapshot.exists()) {
    await runFirestoreOperation(
      setDoc(userRef, {
        id: userId,
        name: displayNameFor(user),
        email: user.email?.trim() || '',
        businessId,
        role: 'owner' satisfies UserRole,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );
  } else {
    await runFirestoreOperation(
      setDoc(
        userRef,
        {
          ...existingUser,
          id: userId,
          name: (existingUser?.name as string | undefined) || displayNameFor(user),
          email: (existingUser?.email as string | undefined) || user.email?.trim() || '',
          businessId,
          updatedAt: timestamp,
        },
        { merge: true },
      ),
    );
  }

  const sessionData = existingUser ? { ...existingUser, businessId, businessName } : { businessId, businessName };
  return buildAuthSession(
    user,
    sessionData,
    businessSnapshot.exists() ? (businessSnapshot.data() as Record<string, unknown>) : null,
    timestamp,
    provider,
  );
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
  const firestore = db;

  if (!firebaseReady || !auth || !firestore) {
    onChange(null);
    return () => undefined;
  }

  let profileUnsubscribe: Unsubscribe = () => undefined;

  return onAuthStateChanged(auth, async (user) => {
    profileUnsubscribe();

    if (!user) {
      onChange(null);
      return;
    }

    const session = buildAuthSession(user);
    onChange(session);

    if (isFirestoreUnavailable()) {
      return;
    }

    void (async () => {
      try {
        const syncedSession = await syncUserDocuments(user);
        onChange(syncedSession);

        if (isFirestoreUnavailable()) {
          return;
        }

        const userId = normalizeFirestoreId(user.uid, user.uid);
        const userRef = doc(firestore, USERS_COLLECTION, userId);
        const userSnapshot = await runFirestoreOperation(getDoc(userRef));
        const userData = userSnapshot.exists() ? (userSnapshot.data() as Record<string, unknown>) : null;
        const businessId = normalizeFirestoreId((userData?.businessId as string | undefined) || user.uid, userId);
        const businessRef = doc(firestore, BUSINESSES_COLLECTION, businessId);
        const businessSnapshot = await runFirestoreOperation(getDoc(businessRef));
        let latestUserData = userData;
        let latestBusinessData = businessSnapshot.exists()
          ? (businessSnapshot.data() as Record<string, unknown>)
          : null;
        const sessionCreatedAt = syncedSession.createdAt || nowIso();

        const emitSession = () => {
          onChange(buildAuthSession(user, latestUserData, latestBusinessData, sessionCreatedAt));
        };

        const unsubscribeUser = onSnapshot(
          userRef,
          (snapshot) => {
            latestUserData = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
            emitSession();
          },
          (error) => {
            markFirestoreUnavailable(error);
            onChange(buildAuthSession(user, latestUserData, latestBusinessData, sessionCreatedAt));
          },
        );

        const unsubscribeBusiness = onSnapshot(
          businessRef,
          (snapshot) => {
            latestBusinessData = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
            emitSession();
          },
          (error) => {
            markFirestoreUnavailable(error);
            onChange(buildAuthSession(user, latestUserData, latestBusinessData, sessionCreatedAt));
          },
        );

        profileUnsubscribe = () => {
          unsubscribeUser();
          unsubscribeBusiness();
        };
      } catch (error) {
        markFirestoreUnavailable(error);
        onChange(buildAuthSession(user));
      }
    })();
  });
}

export async function signInWithGoogle() {
  if (!firebaseReady || !auth || !googleAuthProvider) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  await ensureAuthPersistence();

  try {
    const credential = await signInWithPopup(auth, googleAuthProvider);
    const session = buildAuthSession(credential.user, null, null, nowIso(), 'google');
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
  const session = buildAuthSession(credential.user, null, null, nowIso(), 'email');
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
    null,
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

  if (isFirestoreUnavailableError(error)) {
    return 'O Firestore ainda não foi criado neste projeto Firebase. Crie o banco padrão para continuar salvando dados.';
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
