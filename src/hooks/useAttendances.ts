import { useEffect, useMemo, useState } from 'react';
import type { Attendance, AttendanceUpsertInput } from '../types/domain';
import {
  createAttendanceRecord,
  listenAttendances,
  updateAttendanceRecord,
} from '../services/attendancesService';

type UseAttendancesResult = {
  attendances: Attendance[];
  loading: boolean;
  error: string | null;
  createAttendance: (input: AttendanceUpsertInput, ownerId: string) => Promise<Attendance>;
  updateAttendance: (attendanceId: string, input: AttendanceUpsertInput) => Promise<void>;
};

export function useAttendances(businessId: string | null, ownerId: string | null): UseAttendancesResult {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setAttendances([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenAttendances(
      businessId,
      (nextAttendances) => {
        setAttendances(nextAttendances);
        setLoading(false);
        setError(null);
      },
      () => {
        setAttendances([]);
        setLoading(false);
        setError('Não foi possível carregar os atendimentos agora.');
      },
    );

    return () => unsubscribe();
  }, [businessId]);

  const sortedAttendances = useMemo(() => [...attendances], [attendances]);

  async function createAttendance(input: AttendanceUpsertInput, creatorId: string) {
    if (!businessId) {
      throw new Error('Business indisponível para criar atendimento.');
    }

    return createAttendanceRecord({
      businessId,
      ownerId: ownerId || creatorId,
      input,
    });
  }

  async function updateAttendance(attendanceId: string, input: AttendanceUpsertInput) {
    await updateAttendanceRecord({ attendanceId, input });
  }

  return {
    attendances: sortedAttendances,
    loading,
    error,
    createAttendance,
    updateAttendance,
  };
}
