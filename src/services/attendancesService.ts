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
import { withTimeout } from './asyncTimeout';
import { isFirestoreUnavailable, markFirestoreUnavailable, runFirestoreOperation } from './firestoreHealth';
import { normalizeFirestoreId } from './firestoreIds';
import type { Attendance, AttendanceUpsertInput } from '../types/domain';
import { formatCalendarDate, parseCalendarDate, toDateKey } from '../utils/date';

const ATTENDANCES_COLLECTION = 'attendances';

function nowIso() {
  return new Date().toISOString();
}

function attendanceSortKey(attendance: Attendance) {
  const parsed = parseCalendarDate(attendance.date);

  if (!parsed) {
    return Number.NEGATIVE_INFINITY;
  }

  return parsed.getTime();
}

function normalizeAttendance(data: Record<string, unknown>, id: string): Attendance {
  return {
    id,
    businessId: (data.businessId as string | undefined) || undefined,
    clientId: (data.clientId as string | undefined) || '',
    clientName: (data.clientName as string | undefined) || 'Cliente',
    appointmentId: (data.appointmentId as string | undefined) || undefined,
    date: (data.date as string | undefined) || '',
    title: (data.title as string | undefined) || 'Atendimento',
    description: (data.description as string | undefined) || '',
    nextAction: (data.nextAction as string | undefined) || undefined,
    returnDate: (data.returnDate as string | undefined) || undefined,
    createdAt: (data.createdAt as string | undefined) || undefined,
    updatedAt: (data.updatedAt as string | undefined) || undefined,
  };
}

export function formatAttendanceDate(value: string) {
  return formatCalendarDate(value);
}

export function isAttendanceOnDay(value: string, target = new Date()) {
  const parsed = parseCalendarDate(value);

  if (!parsed) {
    return false;
  }

  return toDateKey(parsed) === toDateKey(target);
}

export function listenAttendances(
  businessId: string,
  onChange: (attendances: Attendance[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  if (!firebaseReady || !db) {
    onChange([]);
    return () => undefined;
  }

  if (isFirestoreUnavailable()) {
    onChange([]);
    return () => undefined;
  }

  const normalizedBusinessId = normalizeFirestoreId(businessId, businessId);
  const attendancesRef = collection(db, ATTENDANCES_COLLECTION);
  const attendancesQuery = query(attendancesRef, where('businessId', '==', normalizedBusinessId));

  return onSnapshot(
    attendancesQuery,
    (snapshot) => {
      const attendances = snapshot.docs
        .map((document) => normalizeAttendance(document.data() as Record<string, unknown>, document.id))
        .sort((left, right) => attendanceSortKey(right) - attendanceSortKey(left));

      onChange(attendances);
    },
    (error) => {
      markFirestoreUnavailable(error);
      onError?.(error);
      onChange([]);
    },
  );
}

export async function createAttendanceRecord(params: {
  businessId: string;
  ownerId: string;
  input: AttendanceUpsertInput;
}) {
  if (!firebaseReady || !db) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const timestamp = nowIso();
  const businessId = normalizeFirestoreId(params.businessId);
  const ownerId = normalizeFirestoreId(params.ownerId);

  if (!businessId || !ownerId) {
    throw new Error('Dados de negócio inválidos para salvar o atendimento.');
  }
  const docRef = await runFirestoreOperation(
    withTimeout(
      addDoc(collection(db, ATTENDANCES_COLLECTION), {
        businessId,
        ownerId,
        clientId: params.input.clientId,
        clientName: params.input.clientName,
        appointmentId: params.input.appointmentId || '',
        date: params.input.date,
        title: params.input.title,
        description: params.input.description,
        nextAction: params.input.nextAction || '',
        returnDate: params.input.returnDate || '',
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
      12000,
      'A criação do atendimento demorou demais. Tente novamente.',
    ),
  );

  return normalizeAttendance(
    {
      businessId,
      ownerId,
      clientId: params.input.clientId,
      clientName: params.input.clientName,
      appointmentId: params.input.appointmentId || '',
      date: params.input.date,
      title: params.input.title,
      description: params.input.description,
      nextAction: params.input.nextAction || '',
      returnDate: params.input.returnDate || '',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    docRef.id,
  );
}

export async function updateAttendanceRecord(params: {
  attendanceId: string;
  input: AttendanceUpsertInput;
}) {
  if (!firebaseReady || !db) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const timestamp = nowIso();
  const attendanceRef = doc(db, ATTENDANCES_COLLECTION, params.attendanceId);

  await runFirestoreOperation(
    withTimeout(
      updateDoc(attendanceRef, {
        clientId: params.input.clientId,
        clientName: params.input.clientName,
        appointmentId: params.input.appointmentId || '',
        date: params.input.date,
        title: params.input.title,
        description: params.input.description,
        nextAction: params.input.nextAction || '',
        returnDate: params.input.returnDate || '',
        updatedAt: timestamp,
      }),
      12000,
      'A atualização do atendimento demorou demais. Tente novamente.',
    ),
  );
}
