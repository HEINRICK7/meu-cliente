import { AddOutline, CheckCircleOutline, LeftOutline, RightOutline } from 'antd-mobile-icons';
import { Button, Card, DatePicker, FloatingBubble, Form, Grid, Input, List, Picker, Popup, SearchBar, Selector, Space, Toast } from 'antd-mobile';
import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import { useClients } from '../../hooks/useClients';
import { isFirestoreUnavailableError } from '../../services/firestoreHealth';
import { formatAppointmentDate } from '../../services/appointmentsService';
import { parseCalendarDate, toDateKey } from '../../utils/date';
import type { Appointment, AppointmentStatus, AppointmentUpsertInput } from '../../types/domain';
import { AppointmentDetailSheet } from './AppointmentDetailSheet';
import { ScheduleTimeline } from './ScheduleTimeline';
import { ScheduleWeekStrip } from './ScheduleWeekStrip';

const statusOptions: Array<{ value: AppointmentStatus; label: string }> = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'atendido', label: 'Atendido' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'faltou', label: 'Faltou' },
];

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minute = String(totalMinutes % 60).padStart(2, '0');
  const value = `${hour}:${minute}`;

  return { label: value, value };
});

const businessHourSlots = Array.from({ length: 21 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minute = String(totalMinutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
});

type AppointmentFormValues = {
  serviceType: string;
  notes?: string;
};

function formatDateLabel(date: Date | null) {
  if (!date) {
    return 'Selecionar data';
  }

  return date.toLocaleDateString('pt-BR');
}

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

function clientSearchText(client: { name: string; phone: string; email?: string }) {
  return normalizeLabel(`${client.name} ${client.phone} ${client.email ?? ''}`);
}

function sortBySchedule(left: Appointment, right: Appointment) {
  const leftDate = parseCalendarDate(left.date);
  const rightDate = parseCalendarDate(right.date);
  const [leftHour = '0', leftMinute = '0'] = left.time.split(':');
  const [rightHour = '0', rightMinute = '0'] = right.time.split(':');
  const leftMinutes = Number(leftHour) * 60 + Number(leftMinute);
  const rightMinutes = Number(rightHour) * 60 + Number(rightMinute);

  const leftStamp = leftDate
    ? leftDate.getTime() + (Number.isFinite(leftMinutes) ? leftMinutes : 0) * 60000
    : Number.POSITIVE_INFINITY;
  const rightStamp = rightDate
    ? rightDate.getTime() + (Number.isFinite(rightMinutes) ? rightMinutes : 0) * 60000
    : Number.POSITIVE_INFINITY;

  if (leftStamp === rightStamp) {
    return left.clientName.localeCompare(right.clientName);
  }

  return leftStamp - rightStamp;
}

function buildWeekDays(referenceDate: Date) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function shiftDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getSaveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error !== 'object' || error === null) {
    return 'Não foi possível salvar o agendamento.';
  }

  const code = 'code' in error ? String((error as { code?: string }).code) : '';

  if (code.includes('permission-denied')) {
    return 'Sem permissão para salvar este agendamento. Verifique as regras do Firebase.';
  }

  if (code.includes('unavailable')) {
    return 'O Firebase está indisponível agora. Tente novamente.';
  }

  if (isFirestoreUnavailableError(error)) {
    return 'O Firestore ainda não foi criado neste projeto Firebase. Crie o banco padrão para continuar salvando dados.';
  }

  if (String(error).includes('demorou demais')) {
    return 'A operação demorou demais. Tente novamente.';
  }

  return 'Não foi possível salvar o agendamento. Tente novamente.';
}

export function ScheduleScreen() {
  const { session } = useAuth();
  const { clients } = useClients(session?.businessId ?? null, session?.id ?? null);
  const { appointments, loading, error, createAppointment, updateAppointment } = useAppointments(
    session?.businessId ?? null,
    session?.id ?? null,
  );

  const [editorVisible, setEditorVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [focusedDate, setFocusedDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>('agendado');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [form] = Form.useForm<AppointmentFormValues>();

  const todayKey = toDateKey(new Date());
  const focusedDateKey = toDateKey(focusedDate);
  const weekDays = useMemo(() => buildWeekDays(focusedDate), [focusedDate]);

  const sortedAppointments = useMemo(
    () => [...appointments].sort(sortBySchedule),
    [appointments],
  );

  const todayAppointments = useMemo(() => sortedAppointments.filter((appointment) => appointment.date === todayKey), [sortedAppointments, todayKey]);
  const focusedDateAppointments = useMemo(
    () => sortedAppointments.filter((appointment) => appointment.date === focusedDateKey),
    [focusedDateKey, sortedAppointments],
  );
  const upcomingAppointments = useMemo(() => sortedAppointments.filter((appointment) => appointment.date > todayKey), [sortedAppointments, todayKey]);
  const appointmentCountsByDate = useMemo(
    () =>
      sortedAppointments.reduce<Record<string, number>>((acc, appointment) => {
        acc[appointment.date] = (acc[appointment.date] ?? 0) + 1;
        return acc;
      }, {}),
    [sortedAppointments],
  );
  const timelineSlots = useMemo(() => {
    const busyTimes = new Set(focusedDateAppointments.map((appointment) => appointment.time));
    const busySlots = focusedDateAppointments.map((appointment) => ({
      time: appointment.time,
      appointment,
    }));
    const freeSlots = businessHourSlots
      .filter((time) => !busyTimes.has(time))
      .map((time) => ({ time }));

    return [...busySlots, ...freeSlots].sort((left, right) => left.time.localeCompare(right.time));
  }, [focusedDateAppointments]);

  const nextAppointment = todayAppointments[0] || upcomingAppointments[0] || sortedAppointments[0] || null;
  const recentClients = useMemo(() => clients.slice(0, 8), [clients]);
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );
  const clientSearchResults = useMemo(() => {
    const normalizedSearch = normalizeLabel(clientSearch);

    if (!normalizedSearch) {
      return recentClients;
    }

    return clients
      .filter((client) => clientSearchText(client).includes(normalizedSearch))
      .slice(0, 8);
  }, [clientSearch, clients, recentClients]);

  function resetEditorState(date = focusedDate, time = '09:00') {
    setSelectedDate(date);
    setSelectedTime(time);
    setSelectedStatus('agendado');
    setSelectedClientId(null);
    setClientSearch('');
    form.resetFields();
    form.setFieldsValue({
      serviceType: 'Atendimento',
      notes: '',
    });
  }

  function openCreateAppointment(date = focusedDate, time = '09:00') {
    setEditingAppointment(null);
    resetEditorState(date, time);
    setEditorVisible(true);
  }

  function openEditAppointment(appointment: Appointment) {
    const appointmentClient =
      clients.find((client) => client.id === appointment.clientId) ??
      clients.find((client) => normalizeLabel(client.name) === normalizeLabel(appointment.clientName)) ??
      null;

    setEditingAppointment(appointment);
    form.setFieldsValue({
      serviceType: appointment.serviceType,
      notes: appointment.notes ?? '',
    });
    setSelectedDate(parseCalendarDate(appointment.date));
    setSelectedTime(appointment.time);
    setSelectedStatus(appointment.status);
    setSelectedClientId(appointmentClient?.id ?? null);
    setClientSearch(appointmentClient?.name ?? appointment.clientName);
    setEditorVisible(true);
  }

  function closeEditor() {
    setEditorVisible(false);
    setEditingAppointment(null);
    resetEditorState();
  }

  function goToToday() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    setFocusedDate(date);
  }

  function openAppointmentDetails(appointment: Appointment) {
    setSelectedAppointment(appointment);
    setDetailVisible(true);
  }

  function closeAppointmentDetails() {
    setDetailVisible(false);
    setSelectedAppointment(null);
  }

  function openFreeSlot(time: string) {
    openCreateAppointment(focusedDate, time);
  }

  function handleClientSearchChange(value: string) {
    setClientSearch(value);

    if (selectedClient && normalizeLabel(value) !== normalizeLabel(selectedClient.name)) {
      setSelectedClientId(null);
    }
  }

  function handleClientSelection(clientId: string) {
    const nextClient = clients.find((client) => client.id === clientId);

    if (!nextClient) {
      return;
    }

    setSelectedClientId(nextClient.id);
    setClientSearch(nextClient.name);
  }

  async function handleSaveAppointment() {
    if (!session) {
      Toast.show({ content: 'Faça login novamente para continuar.' });
      return;
    }

    try {
      setSaving(true);
      const values = await form.validateFields();

      if (!selectedDate) {
        Toast.show({ content: 'Selecione a data do agendamento.' });
        return;
      }

      if (!selectedClient) {
        Toast.show({ content: 'Selecione um cliente cadastrado para o agendamento.' });
        return;
      }

      const payload: AppointmentUpsertInput = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        date: toDateKey(selectedDate),
        time: selectedTime,
        serviceType: values.serviceType.trim(),
        status: selectedStatus,
        notes: values.notes?.trim() || undefined,
      };

      if (editingAppointment) {
        await updateAppointment(editingAppointment.id, payload);
      } else {
        await createAppointment(payload, session.id);
      }

      Toast.show({
        content: editingAppointment ? 'Agendamento atualizado.' : 'Agendamento criado.',
      });
      closeEditor();
    } catch (error) {
      Toast.show({ content: getSaveErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeAppointmentStatus(appointment: Appointment, status: AppointmentStatus) {
    if (!appointment.clientId) {
      Toast.show({ content: 'Este agendamento não tem cliente vinculado.' });
      return;
    }

    try {
      await updateAppointment(appointment.id, {
        clientId: appointment.clientId,
        clientName: appointment.clientName,
        date: appointment.date,
        time: appointment.time,
        serviceType: appointment.serviceType,
        status,
        notes: appointment.notes,
      });
      Toast.show({ content: 'Status atualizado.' });
    } catch (error) {
      Toast.show({ content: getSaveErrorMessage(error) });
    }
  }

  if (loading) {
    return <LoadingState lines={3} />;
  }

  return (
    <div className="screen-stack schedule-screen">
      <Card className="soft-card schedule-calendar-card">
        <div className="schedule-calendar-header">
          <Button
            fill="none"
            className="schedule-icon-button"
            onClick={() => setFocusedDate((date) => shiftDays(date, -7))}
          >
            <LeftOutline />
          </Button>

          <Button fill="none" className="schedule-month-button" onClick={goToToday}>
            <span className="section-label">Agenda</span>
            <strong>
              {focusedDate.toLocaleDateString('pt-BR', {
                month: 'long',
              })}
            </strong>
          </Button>

          <Button
            fill="none"
            className="schedule-icon-button"
            onClick={() => setFocusedDate((date) => shiftDays(date, 7))}
          >
            <RightOutline />
          </Button>
        </div>

        <ScheduleWeekStrip
          days={weekDays}
          selectedDate={focusedDate}
          appointmentCounts={appointmentCountsByDate}
          onSelectDate={setFocusedDate}
        />

        <Grid columns={3} gap={8} className="schedule-day-summary">
          <Grid.Item>
            <div>
              <strong>{todayAppointments.length}</strong>
              <span>Hoje</span>
            </div>
          </Grid.Item>
          <Grid.Item>
            <div>
              <strong>{focusedDateAppointments.length}</strong>
              <span>No dia</span>
            </div>
          </Grid.Item>
          <Grid.Item>
            <div>
              <strong>{nextAppointment ? nextAppointment.time : '--:--'}</strong>
              <span>Próximo</span>
            </div>
          </Grid.Item>
        </Grid>
      </Card>

      <Card className="soft-card schedule-day-card">
        <div className="section-head">
          <div>
            <div className="section-label">Dia selecionado</div>
            <div className="section-title">{formatAppointmentDate(focusedDateKey)}</div>
          </div>
          <Button
            size="small"
            color="primary"
            fill="solid"
            shape="rounded"
            className="schedule-create-button"
            onClick={() => openCreateAppointment()}
          >
            <AddOutline />
            Novo
          </Button>
        </div>

        {error ? (
          <EmptyState title="Erro ao carregar a agenda" description={error} />
        ) : (
          <ScheduleTimeline
            slots={timelineSlots}
            onSelectAppointment={openAppointmentDetails}
            onSelectFreeSlot={openFreeSlot}
          />
        )}
      </Card>

      <Card className="soft-card schedule-status-card">
        <div className="section-label">Legenda</div>
        <Space wrap>
          <span className="schedule-legend schedule-legend--free">Livre</span>
          <span className="schedule-legend schedule-legend--scheduled">Agendado</span>
          <span className="schedule-legend schedule-legend--confirmed">Confirmado</span>
          <span className="schedule-legend schedule-legend--cancelled">Cancelado</span>
          <span className="schedule-legend schedule-legend--missed">Falta</span>
        </Space>
      </Card>

      <FloatingBubble className="schedule-floating-action" onClick={() => openCreateAppointment()}>
        <AddOutline />
      </FloatingBubble>

      <AppointmentDetailSheet
        visible={detailVisible}
        appointment={selectedAppointment}
        onClose={closeAppointmentDetails}
        onEdit={openEditAppointment}
        onChangeStatus={handleChangeAppointmentStatus}
      />

      <Popup
        visible={editorVisible}
        position="bottom"
        onMaskClick={closeEditor}
        bodyStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: '84vh' }}
      >
        <div className="appointment-form-sheet">
          <div className="section-head">
            <div>
              <div className="section-label">{editingAppointment ? 'Editar agendamento' : 'Novo agendamento'}</div>
              <div className="section-title">
                {editingAppointment ? editingAppointment.clientName : 'Cadastro rápido e simples'}
              </div>
            </div>
          </div>

          <div className="appointment-form-group">
            <div className="appointment-form-group__label">Nome do cliente</div>
            {clients.length === 0 ? (
              <p className="muted-text">Nenhum cliente cadastrado ainda. Cadastre um cliente antes de criar o agendamento.</p>
            ) : (
              <>
                <SearchBar
                  value={clientSearch}
                  placeholder="Buscar cliente por nome ou telefone"
                  onChange={handleClientSearchChange}
                />

                {clientSearchResults.length === 0 ? (
                  <p className="muted-text">Nenhum cliente encontrado para essa busca.</p>
                ) : (
                  <List className="appointment-client-results">
                    {clientSearchResults.map((client) => (
                      <List.Item key={client.id} onClick={() => handleClientSelection(client.id)}>
                        <span className="appointment-client-option">
                          <span className="appointment-selector__item">
                            <strong>{client.name}</strong>
                            <span>{client.phone || 'Sem telefone cadastrado'}</span>
                          </span>
                          {selectedClientId === client.id ? <CheckCircleOutline /> : null}
                        </span>
                      </List.Item>
                    ))}
                  </List>
                )}
              </>
            )}
          </div>

          <Form form={form} layout="vertical" className="appointment-form">
            <Form.Item
              name="serviceType"
              label="Serviço"
              rules={[{ required: true, message: 'Informe o tipo de serviço.' }]}
            >
              <Input placeholder="Ex.: Corte, consulta, retorno" clearable />
            </Form.Item>

            <div className="appointment-form-group">
              <div className="appointment-form-group__label">Data</div>
              <DatePicker
                value={selectedDate}
                onConfirm={(nextDate) => setSelectedDate(nextDate)}
                title="Selecionar data"
                confirmText="Selecionar"
                cancelText="Cancelar"
              >
                {(_, actions) => (
                  <Button shape="rounded" fill="outline" onClick={actions.open}>
                    {formatDateLabel(selectedDate)}
                  </Button>
                )}
              </DatePicker>
            </div>

            <div className="appointment-form-group">
              <div className="appointment-form-group__label">Horário</div>
              <Picker
                columns={[timeOptions]}
                value={[selectedTime]}
                onConfirm={(values) => {
                  const nextTime = String(values[0] ?? '09:00');
                  setSelectedTime(nextTime);
                }}
                title="Selecionar horário"
                confirmText="Selecionar"
                cancelText="Cancelar"
              >
                {(_, actions) => (
                  <Button shape="rounded" fill="outline" onClick={actions.open}>
                    {selectedTime}
                  </Button>
                )}
              </Picker>
            </div>

            <div className="appointment-form-group">
              <div className="appointment-form-group__label">Status</div>
              <Selector
                value={[selectedStatus]}
                options={statusOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                columns={2}
                onChange={(values) => setSelectedStatus((values[0] as AppointmentStatus) || 'agendado')}
              />
            </div>

            <Form.Item name="notes" label="Observações">
              <Input placeholder="Detalhes rápidos sobre o horário" clearable />
            </Form.Item>
          </Form>

          <Space wrap className="form-action-row">
            <Button color="primary" fill="solid" size="large" shape="rounded" loading={saving} onClick={handleSaveAppointment}>
              {editingAppointment ? 'Salvar alterações' : 'Criar agendamento'}
            </Button>
            <Button size="large" shape="rounded" onClick={closeEditor}>
              Cancelar
            </Button>
          </Space>
        </div>
      </Popup>
    </div>
  );
}
