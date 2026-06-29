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
import type { Appointment, AppointmentStatus, AppointmentUpsertInput } from '../types/domain';

import { formatCalendarDate, parseCalendarDate, toDateKey } from '../utils/date';

const APPOINTMENTS_COLLECTION = 'appointments';

function nowIso() {
  return new Date().toISOString();
}

function parseDateTimeKey(dateValue: string, timeValue: string) {
  const date = parseCalendarDate(dateValue);

  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  const [hourPart = '0', minutePart = '0'] = timeValue.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Number.isFinite(hour) ? hour : 0,
    Number.isFinite(minute) ? minute : 0,
  ).getTime();
}

function normalizeAppointment(data: Record<string, unknown>, id: string): Appointment {
  return {
    id,
    businessId: (data.businessId as string | undefined) || undefined,
    clientId: (data.clientId as string | undefined) || undefined,
    clientName: (data.clientName as string | undefined) || 'Cliente',
    date: (data.date as string | undefined) || '',
    time: (data.time as string | undefined) || '--:--',
    serviceType: (data.serviceType as string | undefined) || 'Agendamento',
    status: (data.status as AppointmentStatus | undefined) || 'agendado',
    notes: (data.notes as string | undefined) || undefined,
    createdAt: (data.createdAt as string | undefined) || undefined,
    updatedAt: (data.updatedAt as string | undefined) || undefined,
  };
}

export function formatAppointmentDate(value: string) {
  return formatCalendarDate(value);
}

export function isAppointmentOnDay(value: string, target = new Date()) {
  const parsed = parseCalendarDate(value);

  if (!parsed) {
    return false;
  }

  return toDateKey(parsed) === toDateKey(target);
}

export function isAppointmentInRange(value: string, start: Date, end: Date) {
  const parsed = parseCalendarDate(value);

  if (!parsed) {
    return false;
  }

  const dateKey = toDateKey(parsed);
  return dateKey >= toDateKey(start) && dateKey <= toDateKey(end);
}

export function compareAppointmentsBySchedule(left: Appointment, right: Appointment) {
  const difference = parseDateTimeKey(left.date, left.time) - parseDateTimeKey(right.date, right.time);
  return difference === 0 ? left.clientName.localeCompare(right.clientName) : difference;
}

export function listenAppointments(
  businessId: string,
  onChange: (appointments: Appointment[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  if (!firebaseReady || !db) {
    onChange([]);
    return () => undefined;
  }

  const appointmentsRef = collection(db, APPOINTMENTS_COLLECTION);
  const appointmentsQuery = query(appointmentsRef, where('businessId', '==', businessId));

  return onSnapshot(
    appointmentsQuery,
    (snapshot) => {
      const appointments = snapshot.docs
        .map((document) => normalizeAppointment(document.data() as Record<string, unknown>, document.id))
        .sort(compareAppointmentsBySchedule);

      onChange(appointments);
    },
    (error) => {
      onError?.(error);
      onChange([]);
    },
  );
}

export async function createAppointmentRecord(params: {
  businessId: string;
  ownerId: string;
  input: AppointmentUpsertInput;
}) {
  if (!firebaseReady || !db) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const timestamp = nowIso();
  const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
    businessId: params.businessId,
    ownerId: params.ownerId,
    clientId: params.input.clientId || '',
    clientName: params.input.clientName,
    date: params.input.date,
    time: params.input.time,
    serviceType: params.input.serviceType,
    status: params.input.status,
    notes: params.input.notes || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return normalizeAppointment(
    {
      businessId: params.businessId,
      ownerId: params.ownerId,
      clientId: params.input.clientId || '',
      clientName: params.input.clientName,
      date: params.input.date,
      time: params.input.time,
      serviceType: params.input.serviceType,
      status: params.input.status,
      notes: params.input.notes || '',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    docRef.id,
  );
}

export async function updateAppointmentRecord(params: {
  appointmentId: string;
  input: AppointmentUpsertInput;
}) {
  if (!firebaseReady || !db) {
    throw new Error('Firebase não está configurado neste ambiente.');
  }

  const timestamp = nowIso();
  const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, params.appointmentId);

  await updateDoc(appointmentRef, {
    clientId: params.input.clientId || '',
    clientName: params.input.clientName,
    date: params.input.date,
    time: params.input.time,
    serviceType: params.input.serviceType,
    status: params.input.status,
    notes: params.input.notes || '',
    updatedAt: timestamp,
  });
}
