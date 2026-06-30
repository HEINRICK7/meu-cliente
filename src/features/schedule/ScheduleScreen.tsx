import { AddOutline, CalendarOutline, CheckCircleOutline, RightOutline } from 'antd-mobile-icons';
import { Button, Card, DatePicker, Form, Input, List, Popup, Selector, Space, Tabs, Toast } from 'antd-mobile';
import { useMemo, useState } from 'react';
import { AppointmentCard } from '../../components/AppointmentCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import { useClients } from '../../hooks/useClients';
import { isFirestoreUnavailableError } from '../../services/firestoreHealth';
import {
  formatAppointmentDate,
  isAppointmentInRange,
  isAppointmentOnDay,
} from '../../services/appointmentsService';
import { parseCalendarDate, toDateKey } from '../../utils/date';
import type { Appointment, AppointmentStatus, AppointmentUpsertInput } from '../../types/domain';

type ScheduleView = 'hoje' | 'proximos' | 'semana';

const views: Array<{ key: ScheduleView; title: string }> = [
  { key: 'hoje', title: 'Hoje' },
  { key: 'proximos', title: 'Próximos' },
  { key: 'semana', title: 'Semana' },
];

const statusOptions: Array<{ value: AppointmentStatus; label: string }> = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'atendido', label: 'Atendido' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'faltou', label: 'Faltou' },
];

type AppointmentFormValues = {
  clientName: string;
  time: string;
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

  const [view, setView] = useState<ScheduleView>('hoje');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>('agendado');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [form] = Form.useForm<AppointmentFormValues>();

  const todayKey = toDateKey(new Date());
  const weekEnd = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + 6);
    return end;
  }, []);

  const sortedAppointments = useMemo(
    () => [...appointments].sort(sortBySchedule),
    [appointments],
  );

  const todayAppointments = useMemo(
    () => sortedAppointments.filter((appointment) => isAppointmentOnDay(appointment.date)),
    [sortedAppointments],
  );

  const upcomingAppointments = useMemo(
    () => sortedAppointments.filter((appointment) => appointment.date > todayKey),
    [sortedAppointments, todayKey],
  );

  const weekAppointments = useMemo(
    () => sortedAppointments.filter((appointment) => isAppointmentInRange(appointment.date, new Date(), weekEnd)),
    [sortedAppointments, weekEnd],
  );

  const viewAppointments = useMemo(() => {
    if (view === 'hoje') {
      return todayAppointments;
    }

    if (view === 'proximos') {
      return upcomingAppointments;
    }

    return weekAppointments;
  }, [todayAppointments, upcomingAppointments, view, weekAppointments]);

  const nextAppointment = todayAppointments[0] || upcomingAppointments[0] || sortedAppointments[0] || null;
  const recentClients = useMemo(() => clients.slice(0, 8), [clients]);

  function resetEditorState() {
    setSelectedDate(new Date());
    setSelectedStatus('agendado');
    setSelectedClientId(null);
    form.resetFields();
    form.setFieldsValue({
      clientName: '',
      time: '09:00',
      serviceType: 'Atendimento',
      notes: '',
    });
  }

  function openCreateAppointment() {
    setEditingAppointment(null);
    resetEditorState();

    if (recentClients[0]) {
      setSelectedClientId(recentClients[0].id);
      form.setFieldsValue({
        clientName: recentClients[0].name,
      });
    }

    setEditorVisible(true);
  }

  function openEditAppointment(appointment: Appointment) {
    const appointmentClient =
      clients.find((client) => client.id === appointment.clientId) ??
      clients.find((client) => normalizeLabel(client.name) === normalizeLabel(appointment.clientName)) ??
      null;

    setEditingAppointment(appointment);
    form.setFieldsValue({
      clientName: appointmentClient?.name ?? appointment.clientName,
      time: appointment.time,
      serviceType: appointment.serviceType,
      notes: appointment.notes ?? '',
    });
    setSelectedDate(parseCalendarDate(appointment.date));
    setSelectedStatus(appointment.status);
    setSelectedClientId(appointmentClient?.id ?? null);
    setEditorVisible(true);
  }

  function closeEditor() {
    setEditorVisible(false);
    setEditingAppointment(null);
    resetEditorState();
  }

  function handleClientSelection(values: string[]) {
    const nextClientId = values[0] ?? null;
    setSelectedClientId(nextClientId);

    if (!nextClientId) {
      return;
    }

    const selectedClient = clients.find((client) => client.id === nextClientId);
    if (selectedClient) {
      form.setFieldsValue({ clientName: selectedClient.name });
    }
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

      const selectedClient = clients.find((client) => client.id === selectedClientId);

      if (!selectedClient) {
        Toast.show({ content: 'Selecione um cliente cadastrado para o agendamento.' });
        return;
      }

      const payload: AppointmentUpsertInput = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        date: toDateKey(selectedDate),
        time: values.time.trim(),
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

  function openAppointmentAction(appointment: Appointment | null, label: string) {
    if (!appointment) {
      Toast.show({ content: 'Nenhum agendamento disponível agora.' });
      return;
    }

    Toast.show({ content: `${label} abre o editor do agendamento.` });
    openEditAppointment(appointment);
  }

  if (loading) {
    return <LoadingState lines={3} />;
  }

  return (
    <div className="screen-stack">
      <Card className="soft-card hero-meeting-card hero-meeting-card--agenda">
        <div className="section-head">
          <div>
            <div className="section-label">Agenda</div>
            <div className="section-title">Quem precisa ser atendido agora</div>
          </div>
          <Button size="small" color="primary" fill="solid" shape="rounded" onClick={openCreateAppointment}>
            <AddOutline />
            Novo
          </Button>
        </div>

        <div className="mini-summary-grid">
          <div>
            <strong>{todayAppointments.length}</strong>
            <span>Hoje</span>
          </div>
          <div>
            <strong>{viewAppointments.length}</strong>
            <span>No período</span>
          </div>
          <div>
            <strong>{nextAppointment ? nextAppointment.time : '--:--'}</strong>
            <span>Próximo horário</span>
          </div>
        </div>
      </Card>

      <Tabs activeKey={view} onChange={(key) => setView(key as ScheduleView)}>
        {views.map((tab) => (
          <Tabs.Tab key={tab.key} title={tab.title} />
        ))}
      </Tabs>

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Agenda</div>
            <div className="section-title">Compromissos do período</div>
          </div>
          <Button size="small" color="primary" fill="outline" shape="rounded" onClick={openCreateAppointment}>
            <CalendarOutline />
            <RightOutline />
            Ações
          </Button>
        </div>

        {error ? <EmptyState title="Erro ao carregar a agenda" description={error} /> : null}

        {!error && viewAppointments.length === 0 ? (
          <EmptyState
            title="Sem compromissos por enquanto"
            description="Quando houver agenda, ela aparece aqui como cards grandes e simples."
            actionLabel="Novo agendamento"
            onAction={openCreateAppointment}
          />
        ) : (
          <div className="screen-stack">
            {viewAppointments.map((appointment, index) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                emphasis={view === 'hoje' && index === 0}
                onClick={() => openEditAppointment(appointment)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Próximas ações</div>
            <div className="section-title">Operações rápidas</div>
          </div>
        </div>
        <List className="compact-list">
          <List.Item onClick={() => openAppointmentAction(nextAppointment, 'Confirmar horário')}>
            <span className="more-list__item">
              <CheckCircleOutline />
              <span>Confirmar horário</span>
            </span>
          </List.Item>
          <List.Item onClick={() => openAppointmentAction(nextAppointment, 'Reagendar atendimento')}>
            <span className="more-list__item">
              <CalendarOutline />
              <span>Reagendar atendimento</span>
            </span>
          </List.Item>
        </List>
      </Card>

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
            <div className="appointment-form-group__label">Cliente recente</div>
            {recentClients.length === 0 ? (
              <p className="muted-text">Nenhum cliente cadastrado ainda. Cadastre um cliente antes de criar o agendamento.</p>
            ) : (
              <Selector
                value={selectedClientId ? [selectedClientId] : []}
                options={recentClients.map((client) => ({
                  value: client.id,
                  label: (
                    <div className="appointment-selector__item">
                      <strong>{client.name}</strong>
                      <span>{client.phone}</span>
                    </div>
                  ),
                }))}
                columns={1}
                onChange={handleClientSelection}
              />
            )}
          </div>

          <Form form={form} layout="vertical" className="appointment-form">
            <Form.Item
              name="clientName"
              label="Nome do cliente"
              rules={[{ required: true, message: 'Informe o nome do cliente.' }]}
            >
              <Input placeholder="Nome completo" clearable />
            </Form.Item>

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
                  <Button block shape="rounded" fill="outline" onClick={actions.open}>
                    {formatDateLabel(selectedDate)}
                  </Button>
                )}
              </DatePicker>
            </div>

            <Form.Item
              name="time"
              label="Horário"
              rules={[
                { required: true, message: 'Informe o horário.' },
                { pattern: /^\d{2}:\d{2}$/, message: 'Use o formato 00:00.' },
              ]}
            >
              <Input placeholder="09:00" clearable />
            </Form.Item>

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

          <Space direction="vertical" block>
            <Button color="primary" fill="solid" block size="large" shape="rounded" loading={saving} onClick={handleSaveAppointment}>
              {editingAppointment ? 'Salvar alterações' : 'Criar agendamento'}
            </Button>
            <Button block size="large" shape="rounded" onClick={closeEditor}>
              Cancelar
            </Button>
          </Space>
        </div>
      </Popup>
    </div>
  );
}
