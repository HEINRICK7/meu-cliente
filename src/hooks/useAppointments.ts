import { useEffect, useMemo, useState } from 'react';
import type { Appointment, AppointmentUpsertInput } from '../types/domain';
import {
  createAppointmentRecord,
  listenAppointments,
  updateAppointmentRecord,
} from '../services/appointmentsService';

type UseAppointmentsResult = {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  createAppointment: (input: AppointmentUpsertInput, ownerId: string) => Promise<Appointment>;
  updateAppointment: (appointmentId: string, input: AppointmentUpsertInput) => Promise<void>;
};

export function useAppointments(businessId: string | null, ownerId: string | null): UseAppointmentsResult {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenAppointments(
      businessId,
      (nextAppointments) => {
        setAppointments(nextAppointments);
        setLoading(false);
        setError(null);
      },
      () => {
        setAppointments([]);
        setLoading(false);
        setError('Não foi possível carregar a agenda agora.');
      },
    );

    return () => unsubscribe();
  }, [businessId]);

  const sortedAppointments = useMemo(
    () => [...appointments],
    [appointments],
  );

  async function createAppointment(input: AppointmentUpsertInput, creatorId: string) {
    if (!businessId) {
      throw new Error('Business indisponível para criar agendamento.');
    }

    return createAppointmentRecord({
      businessId,
      ownerId: ownerId || creatorId,
      input,
    });
  }

  async function updateAppointment(appointmentId: string, input: AppointmentUpsertInput) {
    await updateAppointmentRecord({ appointmentId, input });
  }

  return {
    appointments: sortedAppointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
  };
}
