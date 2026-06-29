import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/client';
import { withTimeout } from './asyncTimeout';
import { isFirestoreUnavailable, markFirestoreUnavailable, runFirestoreOperation } from './firestoreHealth';
import { normalizeFirestoreId } from './firestoreIds';
import type { Business, User } from '../types/domain';

function normalizeUser(data: Record<string, unknown>, id: string): User {
  return {
    id,
    name: (data.name as string | undefined) || 'Usuário',
    email: (data.email as string | undefined) || '',
    businessId: (data.businessId as string | undefined) || id,
    role: (data.role as User['role'] | undefined) || 'owner',
    pushToken: (data.pushToken as string | undefined) || undefined,
    pushNotificationsEnabled: (data.pushNotificationsEnabled as boolean | undefined) || undefined,
    pushTokenUpdatedAt: (data.pushTokenUpdatedAt as string | undefined) || undefined,
    createdAt: (data.createdAt as string | undefined) || undefined,
    updatedAt: (data.updatedAt as string | undefined) || undefined,
  };
}

function normalizeBusiness(data: Record<string, unknown>, id: string): Business {
  return {
    id,
    name: (data.name as string | undefined) || 'Meu Cliente',
    ownerId: (data.ownerId as string | undefined) || '',
    segment: (data.segment as string | undefined) || 'Serviços',
    createdAt: (data.createdAt as string | undefined) || undefined,
    updatedAt: (data.updatedAt as string | undefined) || undefined,
  };
}

export function listenUserProfile(userId: string, onChange: (user: User | null) => void, onError?: (error: unknown) => void): Unsubscribe {
  if (!firebaseReady || !db) {
    onChange(null);
    return () => undefined;
  }

  if (isFirestoreUnavailable()) {
    onChange(null);
    return () => undefined;
  }

  const userRef = doc(db, 'users', normalizeFirestoreId(userId, userId));

  return onSnapshot(
    userRef,
    (snapshot) => {
      onChange(snapshot.exists() ? normalizeUser(snapshot.data() as Record<string, unknown>, snapshot.id) : null);
    },
    (error) => {
      markFirestoreUnavailable(error);
      onError?.(error);
      onChange(null);
    },
  );
}

export function listenBusinessProfile(
  businessId: string,
  onChange: (business: Business | null) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  if (!firebaseReady || !db) {
    onChange(null);
    return () => undefined;
  }

  if (isFirestoreUnavailable()) {
    onChange(null);
    return () => undefined;
  }

  const businessRef = doc(db, 'businesses', normalizeFirestoreId(businessId, businessId));

  return onSnapshot(
    businessRef,
    (snapshot) => {
      onChange(snapshot.exists() ? normalizeBusiness(snapshot.data() as Record<string, unknown>, snapshot.id) : null);
    },
    (error) => {
      markFirestoreUnavailable(error);
      onError?.(error);
      onChange(null);
    },
  );
}

export async function updateUserProfileRecord(userId: string, data: { name: string }) {
  if (!firebaseReady || !db) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const timestamp = new Date().toISOString();
  const userRef = doc(db, 'users', normalizeFirestoreId(userId, userId));

  await runFirestoreOperation(
    withTimeout(
      setDoc(
        userRef,
        {
          name: data.name.trim(),
          updatedAt: timestamp,
        },
        { merge: true },
      ),
      12000,
      'A atualização do perfil demorou demais. Tente novamente.',
    ),
  );
}

export async function updateBusinessProfileRecord(
  businessId: string,
  data: { name: string; segment: string },
) {
  if (!firebaseReady || !db) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const timestamp = new Date().toISOString();
  const businessRef = doc(db, 'businesses', normalizeFirestoreId(businessId, businessId));

  await runFirestoreOperation(
    withTimeout(
      setDoc(
        businessRef,
        {
          name: data.name.trim(),
          segment: data.segment.trim(),
          updatedAt: timestamp,
        },
        { merge: true },
      ),
      12000,
      'A atualização do negócio demorou demais. Tente novamente.',
    ),
  );
}
