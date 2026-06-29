import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/client';
import type { Business, User } from '../types/domain';

function normalizeUser(data: Record<string, unknown>, id: string): User {
  return {
    id,
    name: (data.name as string | undefined) || 'Usuário',
    email: (data.email as string | undefined) || '',
    businessId: (data.businessId as string | undefined) || id,
    role: (data.role as User['role'] | undefined) || 'owner',
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

  const userRef = doc(db, 'users', userId);

  return onSnapshot(
    userRef,
    (snapshot) => {
      onChange(snapshot.exists() ? normalizeUser(snapshot.data() as Record<string, unknown>, snapshot.id) : null);
    },
    (error) => {
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

  const businessRef = doc(db, 'businesses', businessId);

  return onSnapshot(
    businessRef,
    (snapshot) => {
      onChange(snapshot.exists() ? normalizeBusiness(snapshot.data() as Record<string, unknown>, snapshot.id) : null);
    },
    (error) => {
      onError?.(error);
      onChange(null);
    },
  );
}
