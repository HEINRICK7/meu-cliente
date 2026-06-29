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
import type { Attendance, AttendanceUpsertInput } from '../types/domain';

const ATTENDANCES_COLLECTION = 'attendances';

function nowIso() {
  return new Date().toISOString();
}

function pad(value: number) {
  return `${value}`.padStart(2, '0');
}

function parseStoredDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const brazilianMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (brazilianMatch) {
    const [, day, month, year] = brazilianMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function attendanceSortKey(attendance: Attendance) {
  const parsed = parseStoredDate(attendance.date);

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
  const parsed = parseStoredDate(value);

  if (!parsed) {
    return value || 'Data sem registro';
  }

  return parsed.toLocaleDateString('pt-BR');
}

export function isAttendanceOnDay(value: string, target = new Date()) {
  const parsed = parseStoredDate(value);

  if (!parsed) {
    return false;
  }

  return localDateKey(parsed) === localDateKey(target);
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

  const attendancesRef = collection(db, ATTENDANCES_COLLECTION);
  const attendancesQuery = query(attendancesRef, where('businessId', '==', businessId));

  return onSnapshot(
    attendancesQuery,
    (snapshot) => {
      const attendances = snapshot.docs
        .map((document) => normalizeAttendance(document.data() as Record<string, unknown>, document.id))
        .sort((left, right) => attendanceSortKey(right) - attendanceSortKey(left));

      onChange(attendances);
    },
    (error) => {
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
  const docRef = await addDoc(collection(db, ATTENDANCES_COLLECTION), {
    businessId: params.businessId,
    ownerId: params.ownerId,
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
  });

  return normalizeAttendance(
    {
      businessId: params.businessId,
      ownerId: params.ownerId,
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

  await updateDoc(attendanceRef, {
    clientId: params.input.clientId,
    clientName: params.input.clientName,
    appointmentId: params.input.appointmentId || '',
    date: params.input.date,
    title: params.input.title,
    description: params.input.description,
    nextAction: params.input.nextAction || '',
    returnDate: params.input.returnDate || '',
    updatedAt: timestamp,
  });
}
