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

function normalizeRequiredAppointmentClient(input: AppointmentUpsertInput) {
  const clientId = normalizeFirestoreId(input.clientId);
  const clientName = input.clientName.trim();

  if (!clientId) {
    throw new Error('Selecione um cliente válido para salvar o agendamento.');
  }

  if (!clientName) {
    throw new Error('Informe o nome do cliente para salvar o agendamento.');
  }

  return { clientId, clientName };
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

  if (isFirestoreUnavailable()) {
    onChange([]);
    return () => undefined;
  }

  const normalizedBusinessId = normalizeFirestoreId(businessId, businessId);
  const appointmentsRef = collection(db, APPOINTMENTS_COLLECTION);
  const appointmentsQuery = query(appointmentsRef, where('businessId', '==', normalizedBusinessId));

  return onSnapshot(
    appointmentsQuery,
    (snapshot) => {
      const appointments = snapshot.docs
        .map((document) => normalizeAppointment(document.data() as Record<string, unknown>, document.id))
        .sort(compareAppointmentsBySchedule);

      onChange(appointments);
    },
    (error) => {
      markFirestoreUnavailable(error);
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
  const businessId = normalizeFirestoreId(params.businessId);
  const ownerId = normalizeFirestoreId(params.ownerId);

  if (!businessId || !ownerId) {
    throw new Error('Dados de negócio inválidos para salvar o agendamento.');
  }

  const appointmentClient = normalizeRequiredAppointmentClient(params.input);
  const docRef = await runFirestoreOperation(
    withTimeout(
      addDoc(collection(db, APPOINTMENTS_COLLECTION), {
        businessId,
        ownerId,
        clientId: appointmentClient.clientId,
        clientName: appointmentClient.clientName,
        date: params.input.date,
        time: params.input.time,
        serviceType: params.input.serviceType,
        status: params.input.status,
        notes: params.input.notes || '',
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
      12000,
      'A criação do agendamento demorou demais. Tente novamente.',
    ),
  );

  return normalizeAppointment(
    {
      businessId,
      ownerId,
      clientId: appointmentClient.clientId,
      clientName: appointmentClient.clientName,
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
  const appointmentClient = normalizeRequiredAppointmentClient(params.input);

  await runFirestoreOperation(
    withTimeout(
      updateDoc(appointmentRef, {
        clientId: appointmentClient.clientId,
        clientName: appointmentClient.clientName,
        date: params.input.date,
        time: params.input.time,
        serviceType: params.input.serviceType,
        status: params.input.status,
        notes: params.input.notes || '',
        updatedAt: timestamp,
      }),
      12000,
      'A atualização do agendamento demorou demais. Tente novamente.',
    ),
  );
}
