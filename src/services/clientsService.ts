import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  type Unsubscribe,
  where,
} from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/client';
import type { Client, ClientStatus, ClientUpsertInput } from '../types/domain';

const CLIENTS_COLLECTION = 'clients';

function nowIso() {
  return new Date().toISOString();
}

function normalizeClient(data: Record<string, unknown>, id: string): Client {
  return {
    id,
    businessId: (data.businessId as string | undefined) || undefined,
    name: (data.name as string | undefined) || 'Cliente',
    phone: (data.phone as string | undefined) || '',
    email: (data.email as string | undefined) || undefined,
    birthDate: (data.birthDate as string | undefined) || undefined,
    notes: (data.notes as string | undefined) || undefined,
    status: (data.status as ClientStatus | undefined) || 'ativo',
    lastAttendance: (data.lastAttendance as string | undefined) || undefined,
    nextAppointment: (data.nextAppointment as string | undefined) || undefined,
    createdAt: (data.createdAt as string | undefined) || undefined,
    updatedAt: (data.updatedAt as string | undefined) || undefined,
  };
}

export function listenClients(businessId: string, onChange: (clients: Client[]) => void, onError?: (error: unknown) => void): Unsubscribe {
  if (!firebaseReady || !db) {
    onChange([]);
    return () => undefined;
  }

  const clientsRef = collection(db, CLIENTS_COLLECTION);
  const clientsQuery = query(clientsRef, where('businessId', '==', businessId));

  return onSnapshot(
    clientsQuery,
    (snapshot) => {
      const clients = snapshot.docs
        .map((document) => normalizeClient(document.data() as Record<string, unknown>, document.id))
        .sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''));

      onChange(clients);
    },
    (error) => {
      onError?.(error);
      onChange([]);
    },
  );
}

export async function createClientRecord(params: {
  businessId: string;
  ownerId: string;
  input: ClientUpsertInput;
}) {
  if (!firebaseReady || !db) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const timestamp = nowIso();

  const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), {
    businessId: params.businessId,
    ownerId: params.ownerId,
    name: params.input.name,
    phone: params.input.phone,
    email: params.input.email || '',
    birthDate: params.input.birthDate || '',
    notes: params.input.notes || '',
    status: params.input.status,
    lastAttendance: '',
    nextAppointment: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return normalizeClient(
    {
      businessId: params.businessId,
      ownerId: params.ownerId,
      name: params.input.name,
      phone: params.input.phone,
      email: params.input.email || '',
      birthDate: params.input.birthDate || '',
      notes: params.input.notes || '',
      status: params.input.status,
      lastAttendance: '',
      nextAppointment: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    docRef.id,
  );
}

export async function updateClientRecord(params: {
  clientId: string;
  input: ClientUpsertInput;
}) {
  if (!firebaseReady || !db) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const timestamp = nowIso();
  const clientRef = doc(db, CLIENTS_COLLECTION, params.clientId);

  await updateDoc(clientRef, {
    name: params.input.name,
    phone: params.input.phone,
    email: params.input.email || '',
    birthDate: params.input.birthDate || '',
    notes: params.input.notes || '',
    status: params.input.status,
    updatedAt: timestamp,
  });
}
