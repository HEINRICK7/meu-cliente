import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, ensureAuthPersistence, googleAuthProvider } from '../firebase/client';
import type { AuthSession, UserRole } from '../types/domain';

const USERS_COLLECTION = 'users';
const BUSINESSES_COLLECTION = 'businesses';

function nowIso() {
  return new Date().toISOString();
}

function displayNameFor(user: FirebaseUser) {
  return user.displayName?.trim() || user.email?.split('@')[0]?.trim() || 'Usuário';
}

async function ensureUserDocuments(user: FirebaseUser): Promise<AuthSession> {
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

  return {
    id: user.uid,
    name: (existingUser?.name as string | undefined) || displayNameFor(user),
    email: (existingUser?.email as string | undefined) || user.email?.trim() || '',
    provider: 'google',
    businessId,
    businessName,
    role: (existingUser?.role as UserRole | undefined) || 'owner',
    photoURL: user.photoURL || undefined,
    createdAt: (existingUser?.createdAt as string | undefined) || timestamp,
  };
}

export function listenToAuthSession(onChange: (session: AuthSession | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onChange(null);
      return;
    }

    const session = await ensureUserDocuments(user);
    onChange(session);
  });
}

export async function signInWithGoogle() {
  await ensureAuthPersistence();
  const credential = await signInWithPopup(auth, googleAuthProvider);
  return ensureUserDocuments(credential.user);
}

export async function signOut() {
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

  return 'Não foi possível autenticar agora.';
}
