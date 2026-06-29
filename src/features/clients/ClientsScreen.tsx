import { AddOutline, CalendarOutline, ClockCircleOutline, UserAddOutline } from 'antd-mobile-icons';
import {
  Button,
  Card,
  Form,
  Input,
  Popup,
  SearchBar,
  Space,
  Switch,
  Tabs,
  TextArea,
  Toast,
} from 'antd-mobile';
import { useEffect, useMemo, useState } from 'react';
import { AppointmentCard } from '../../components/AppointmentCard';
import { AttachmentsPanel } from '../../components/AttachmentsPanel';
import { ClientCard } from '../../components/ClientCard';
import { AttendanceCard } from '../../components/AttendanceCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { QuickActionButton } from '../../components/QuickActionButton';
import { useAppointments } from '../../hooks/useAppointments';
import { useAttendances } from '../../hooks/useAttendances';
import { useAuth } from '../../hooks/useAuth';
import { useClients } from '../../hooks/useClients';
import { formatAttendanceDate } from '../../services/attendancesService';
import { formatAppointmentDate } from '../../services/appointmentsService';
import type { Appointment, Attendance, Client, ClientStatus, ClientUpsertInput } from '../../types/domain';

const statusTabs: Array<{ key: 'todos' | ClientStatus; title: string }> = [
  { key: 'todos', title: 'Todos' },
  { key: 'ativo', title: 'Ativos' },
  { key: 'inativo', title: 'Inativos' },
];

type ClientFormValues = {
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  notes?: string;
  active: boolean;
};

type ClientHistoryEntry =
  | {
      kind: 'appointment';
      key: string;
      date: string;
      time: string;
      title: string;
      subtitle: string;
      record: Appointment;
    }
  | {
      kind: 'attendance';
      key: string;
      date: string;
      time: string;
      title: string;
      subtitle: string;
      record: Attendance;
    };

function clientFormToPayload(values: ClientFormValues): ClientUpsertInput {
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email?.trim() || undefined,
    birthDate: values.birthDate?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    status: values.active ? 'ativo' : 'inativo',
  };
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

function parseStoredDate(value: string) {
  const trimmed = value.trim();

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

function parseDateTimeKey(dateValue: string, timeValue = '00:00') {
  const parsed = parseStoredDate(dateValue);

  if (!parsed) {
    return Number.NEGATIVE_INFINITY;
  }

  const [hourPart = '0', minutePart = '0'] = timeValue.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    Number.isFinite(hour) ? hour : 0,
    Number.isFinite(minute) ? minute : 0,
  ).getTime();
}

function isFutureAppointment(dateValue: string, timeValue: string) {
  const stamp = parseDateTimeKey(dateValue, timeValue);
  return stamp >= Date.now() - 60 * 1000;
}

function goToRoute(route: 'agenda' | 'atendimentos') {
  if (typeof window !== 'undefined') {
    window.location.hash = `#/${route}`;
  }
}

export function ClientsScreen() {
  const { session } = useAuth();
  const { clients: allClients, loading, error, createClient, updateClient } = useClients(
    session?.businessId ?? null,
    session?.id ?? null,
  );
  const { appointments } = useAppointments(session?.businessId ?? null, session?.id ?? null);
  const { attendances } = useAttendances(session?.businessId ?? null, session?.id ?? null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'todos' | ClientStatus>('todos');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<ClientFormValues>();

  const clients = useMemo(() => {
    const normalizedQuery = normalizeQuery(query);

    return allClients.filter((client) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [client.name, client.phone, client.email ?? ''].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const matchesStatus = status === 'todos' || client.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [allClients, query, status]);

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? clients[0] ?? null;
  const selectedClientAppointments = useMemo(() => {
    if (!selectedClient) {
      return [];
    }

    return [...appointments]
      .filter((appointment) => {
        const byId = appointment.clientId && appointment.clientId === selectedClient.id;
        const byName = normalizeLabel(appointment.clientName) === normalizeLabel(selectedClient.name);

        return byId || byName;
      })
      .sort((left, right) => parseDateTimeKey(right.date, right.time) - parseDateTimeKey(left.date, left.time));
  }, [appointments, selectedClient]);

  const selectedClientAppointmentsAsc = useMemo(
    () => [...selectedClientAppointments].sort((left, right) => parseDateTimeKey(left.date, left.time) - parseDateTimeKey(right.date, right.time)),
    [selectedClientAppointments],
  );

  const selectedClientAttendances = useMemo(() => {
    if (!selectedClient) {
      return [];
    }

    return [...attendances]
      .filter((attendance) => {
        const byId = attendance.clientId === selectedClient.id;
        const byName = normalizeLabel(attendance.clientName) === normalizeLabel(selectedClient.name);

        return byId || byName;
      })
      .sort((left, right) => parseDateTimeKey(right.date) - parseDateTimeKey(left.date));
  }, [attendances, selectedClient]);

  const nextClientAppointment = selectedClientAppointmentsAsc.find((appointment) =>
    isFutureAppointment(appointment.date, appointment.time),
  );
  const lastClientAttendance = selectedClientAttendances[0] ?? null;
  const recentClientHistory = useMemo(() => {
    if (!selectedClient) {
      return [] as ClientHistoryEntry[];
    }

    const appointmentEvents: ClientHistoryEntry[] = selectedClientAppointments.map((appointment) => ({
      kind: 'appointment' as const,
      key: `appointment-${appointment.id}`,
      date: appointment.date,
      time: appointment.time,
      title: appointment.serviceType,
      subtitle: appointment.status,
      record: appointment,
    }));

    const attendanceEvents: ClientHistoryEntry[] = selectedClientAttendances.map((attendance) => ({
      kind: 'attendance' as const,
      key: `attendance-${attendance.id}`,
      date: attendance.date,
      time: '',
      title: attendance.title,
      subtitle: attendance.description,
      record: attendance,
    }));

    return [...appointmentEvents, ...attendanceEvents].sort(
      (left, right) => parseDateTimeKey(right.date, right.time) - parseDateTimeKey(left.date, left.time),
    );
  }, [selectedClient, selectedClientAppointments, selectedClientAttendances]);

  useEffect(() => {
    if (clients.length === 0) {
      setSelectedClientId(null);
      return;
    }

    if (!selectedClientId || !clients.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  function openCreateClient() {
    setEditingClient(null);
    form.resetFields();
    form.setFieldsValue({ active: true });
    setEditorVisible(true);
  }

  function openEditClient(client: Client) {
    setEditingClient(client);
    form.setFieldsValue({
      name: client.name,
      phone: client.phone,
      email: client.email,
      birthDate: client.birthDate,
      notes: client.notes,
      active: client.status === 'ativo',
    });
    setEditorVisible(true);
  }

  function closeEditor() {
    setEditorVisible(false);
    setEditingClient(null);
    form.resetFields();
  }

  async function handleSubmit() {
    if (!session) {
      Toast.show({ content: 'Faça login novamente para continuar.' });
      return;
    }

    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const payload = clientFormToPayload(values as ClientFormValues);
      const savedClient = editingClient
        ? await updateClient(editingClient.id, payload)
        : await createClient(payload, session.id);

      setSelectedClientId(savedClient?.id ?? editingClient?.id ?? null);
      closeEditor();
      Toast.show({
        content: editingClient ? 'Cliente atualizado.' : 'Cliente criado.',
      });
    } catch {
      // Validation already explains what is missing.
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState lines={3} />;
  }

  return (
    <div className="screen-stack">
      <SearchBar value={query} placeholder="Buscar cliente" onChange={setQuery} />

      <Tabs activeKey={status} onChange={(key) => setStatus(key as 'todos' | ClientStatus)}>
        {statusTabs.map((tab) => (
          <Tabs.Tab key={tab.key} title={tab.title} />
        ))}
      </Tabs>

      <Card className="soft-card highlight-card">
        <div className="section-head">
          <div>
            <div className="section-label">Visão rápida</div>
            <div className="section-title">Cadastro e consulta</div>
          </div>
          <Button color="primary" fill="solid" size="small" shape="rounded" onClick={openCreateClient}>
            <UserAddOutline />
            Novo
          </Button>
        </div>

        <div className="client-summary-grid">
          <div>
            <strong>{allClients.length}</strong>
            <span>Total</span>
          </div>
          <div>
            <strong>{allClients.filter((client) => client.status === 'ativo').length}</strong>
            <span>Ativos</span>
          </div>
          <div>
            <strong>{allClients.filter((client) => client.nextAppointment).length}</strong>
            <span>Com agenda</span>
          </div>
        </div>
      </Card>

      {error ? <EmptyState title="Erro ao carregar clientes" description={error} /> : null}

      {selectedClient ? (
        <div className="screen-stack">
          <Card className="soft-card highlight-card highlight-card--yellow">
            <div className="section-head">
              <div>
                <div className="section-label">Perfil completo</div>
                <div className="section-title">{selectedClient.name}</div>
              </div>
            </div>

            <div className="client-profile-grid">
              <div>
                <strong>{selectedClientAppointments.length}</strong>
                <span>Agendamentos</span>
              </div>
              <div>
                <strong>{selectedClientAttendances.length}</strong>
                <span>Atendimentos</span>
              </div>
              <div>
                <strong>{lastClientAttendance ? formatAttendanceDate(lastClientAttendance.date) : '--'}</strong>
                <span>Último atendimento</span>
              </div>
              <div>
                <strong>{nextClientAppointment ? formatAppointmentDate(nextClientAppointment.date) : '--'}</strong>
                <span>Próximo agendamento</span>
              </div>
            </div>

            <div className="client-card__meta">
              <span>{selectedClient.phone}</span>
              <span>{selectedClient.email ?? 'Sem e-mail cadastrado'}</span>
              {selectedClient.notes ? <span>{selectedClient.notes}</span> : null}
            </div>

            <div className="quick-actions-grid client-detail-actions">
              <QuickActionButton
                label="Agendar"
                hint="Abrir agenda"
                onClick={() => goToRoute('agenda')}
                tone="primary"
                icon={<CalendarOutline />}
              />
              <QuickActionButton
                label="Atendimento"
                hint="Registrar agora"
                onClick={() => goToRoute('atendimentos')}
                icon={<ClockCircleOutline />}
              />
            </div>

            <Button block shape="rounded" style={{ marginTop: 12 }} onClick={() => openEditClient(selectedClient)}>
              Editar cliente
            </Button>
          </Card>

          <Card className="soft-card">
            <div className="section-head">
              <div>
                <div className="section-label">Próximo agendamento</div>
                <div className="section-title">Último horário futuro</div>
              </div>
            </div>
            {nextClientAppointment ? (
              <AppointmentCard appointment={nextClientAppointment} emphasis />
            ) : (
              <EmptyState
                title="Sem próximo agendamento"
                description="Abra a agenda para criar um horário para esse cliente."
                actionLabel="Abrir agenda"
                onAction={() => goToRoute('agenda')}
              />
            )}
          </Card>

          <Card className="soft-card">
            <div className="section-head">
              <div>
                <div className="section-label">Último atendimento</div>
                <div className="section-title">Resumo mais recente</div>
              </div>
            </div>
            {lastClientAttendance ? (
              <AttendanceCard attendance={lastClientAttendance} />
            ) : (
              <EmptyState
                title="Sem atendimento salvo"
                description="Registre um atendimento para completar o histórico do cliente."
                actionLabel="Registrar atendimento"
                onAction={() => goToRoute('atendimentos')}
              />
            )}
          </Card>

          <Card className="soft-card">
            <div className="section-head">
              <div>
                <div className="section-label">Histórico completo</div>
                <div className="section-title">Agendamentos e atendimentos</div>
              </div>
            </div>
            {recentClientHistory.length === 0 ? (
              <EmptyState
                title="Nenhum histórico ainda"
                description="Quando houver agenda ou atendimento, o histórico aparece aqui."
              />
            ) : (
              <div className="screen-stack">
                {recentClientHistory.map((entry) =>
                  entry.kind === 'appointment' ? (
                    <AppointmentCard key={entry.key} appointment={entry.record} />
                  ) : (
                    <AttendanceCard key={entry.key} attendance={entry.record} />
                  ),
                )}
              </div>
            )}
          </Card>

          <AttachmentsPanel
            title="Anexos do cliente"
            description="Documentos, imagens e comprovantes vinculados ao cadastro."
            businessId={session?.businessId ?? null}
            ownerId={session?.id ?? null}
            clientId={selectedClient.id}
            emptyTitle="Nenhum anexo neste cliente"
            emptyDescription="Envie arquivos para manter tudo junto do cadastro."
          />
        </div>
      ) : null}

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Lista</div>
            <div className="section-title">Clientes encontrados</div>
          </div>
          <Button size="small" color="primary" fill="solid" shape="rounded" onClick={openCreateClient}>
            <AddOutline />
            Novo
          </Button>
        </div>

        {clients.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Tente outro nome, telefone ou status."
            actionLabel="Novo cliente"
            onAction={openCreateClient}
          />
        ) : (
          <div className="screen-stack">
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                selected={client.id === selectedClient?.id}
                onClick={() => setSelectedClientId(client.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <Space direction="vertical" block>
        <Button color="primary" fill="solid" block size="large" shape="rounded" onClick={openCreateClient}>
          <UserAddOutline />
          Novo cliente
        </Button>
      </Space>

      <Popup
        visible={editorVisible}
        position="bottom"
        onMaskClick={closeEditor}
        bodyStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: '78vh' }}
      >
        <div className="client-form-sheet">
          <div className="section-head">
            <div>
              <div className="section-label">{editingClient ? 'Editar cliente' : 'Novo cliente'}</div>
              <div className="section-title">
                {editingClient ? editingClient.name : 'Cadastro rápido e simples'}
              </div>
            </div>
          </div>

          <Form form={form} layout="vertical" initialValues={{ active: true }}>
            <Form.Item
              name="name"
              label="Nome"
              rules={[{ required: true, message: 'Informe o nome do cliente.' }]}
            >
              <Input placeholder="Nome completo" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Telefone"
              rules={[{ required: true, message: 'Informe o telefone.' }]}
            >
              <Input placeholder="(11) 99999-9999" />
            </Form.Item>

            <Form.Item name="email" label="E-mail">
              <Input placeholder="cliente@email.com" />
            </Form.Item>

            <Form.Item name="birthDate" label="Data de nascimento">
              <Input placeholder="DD/MM/AAAA" />
            </Form.Item>

            <Form.Item name="notes" label="Observações">
              <TextArea rows={4} placeholder="Preferências, detalhes importantes ou observações curtas" />
            </Form.Item>

            <Form.Item name="active" label="Cliente ativo" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>

          <div className="client-form-footer">
            <Button block onClick={closeEditor}>
              Cancelar
            </Button>
            <Button color="primary" fill="solid" block onClick={handleSubmit} loading={submitting}>
              {editingClient ? 'Salvar alterações' : 'Criar cliente'}
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
}
