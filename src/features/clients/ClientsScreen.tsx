import { AddOutline, UserAddOutline, UserOutline } from 'antd-mobile-icons';
import {
  Button,
  Card,
  CapsuleTabs,
  DatePicker,
  Ellipsis,
  Form,
  Input,
  List,
  Popup,
  SearchBar,
  Space,
  Switch,
  TextArea,
  Toast,
} from 'antd-mobile';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { useAppointments } from '../../hooks/useAppointments';
import { useAttendances } from '../../hooks/useAttendances';
import { useAuth } from '../../hooks/useAuth';
import { useClients } from '../../hooks/useClients';
import { isFirestoreUnavailableError } from '../../services/firestoreHealth';
import { formatAttendanceDate } from '../../services/attendancesService';
import { formatAppointmentDate } from '../../services/appointmentsService';
import { formatPhone, normalizeEmail, onlyDigits } from '../../utils/contact';
import { parseCalendarDate, toDateKey } from '../../utils/date';
import type { Client, ClientStatus, ClientUpsertInput } from '../../types/domain';
import { ClientProfileSheet } from './ClientProfileSheet';

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

function clientFormToPayload(values: ClientFormValues): ClientUpsertInput {
  return {
    name: values.name.trim(),
    phone: onlyDigits(values.phone),
    email: normalizeEmail(values.email) || undefined,
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

function formatDateLabel(date: Date | null) {
  if (!date) {
    return 'Selecionar data';
  }

  return date.toLocaleDateString('pt-BR');
}

function parseDateTimeKey(dateValue: string, timeValue = '00:00') {
  const parsed = parseCalendarDate(dateValue);

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

  function getSaveErrorMessage(error: unknown) {
    if (typeof error !== 'object' || error === null) {
      return 'Não foi possível salvar o cliente.';
    }

    const code = 'code' in error ? String((error as { code?: string }).code) : '';

  if (code.includes('permission-denied')) {
    return 'Sem permissão para salvar este cliente. Verifique as regras do Firebase.';
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

  return 'Não foi possível salvar o cliente. Tente novamente.';
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
  const [selectedBirthDate, setSelectedBirthDate] = useState<Date | null>(null);
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

  const selectedClient = allClients.find((client) => client.id === selectedClientId) ?? null;
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
  useEffect(() => {
    if (!selectedClientId) {
      return;
    }

    if (!allClients.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(null);
    }
  }, [allClients, selectedClientId]);

  function openCreateClient() {
    setEditingClient(null);
    setSelectedBirthDate(null);
    form.resetFields();
    form.setFieldsValue({ active: true });
    setEditorVisible(true);
  }

  function openEditClient(client: Client) {
    setEditingClient(client);
    setSelectedBirthDate(client.birthDate ? parseCalendarDate(client.birthDate) : null);
    form.setFieldsValue({
      name: client.name,
      phone: formatPhone(client.phone),
      email: client.email ? normalizeEmail(client.email) : undefined,
      notes: client.notes,
      active: client.status === 'ativo',
    });
    setEditorVisible(true);
  }

  function closeEditor() {
    setEditorVisible(false);
    setEditingClient(null);
    setSelectedBirthDate(null);
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
      const payload = {
        ...clientFormToPayload(values as ClientFormValues),
        birthDate: selectedBirthDate ? toDateKey(selectedBirthDate) : undefined,
      };
      const savedClient = editingClient
        ? await updateClient(editingClient.id, payload)
        : await createClient(payload, session.id);

      setSelectedClientId(savedClient?.id ?? editingClient?.id ?? null);
      closeEditor();
      Toast.show({
        content: editingClient ? 'Cliente atualizado.' : 'Cliente criado.',
      });
    } catch (error) {
      Toast.show({ content: getSaveErrorMessage(error) });
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

      <CapsuleTabs className="filter-tabs" activeKey={status} onChange={(key) => setStatus(key as 'todos' | ClientStatus)}>
        {statusTabs.map((tab) => (
          <CapsuleTabs.Tab key={tab.key} title={tab.title} />
        ))}
      </CapsuleTabs>

      {error ? <EmptyState title="Erro ao carregar clientes" description={error} /> : null}

      {clients.length === 0 ? (
        <Card className="soft-card">
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Tente outro nome, telefone ou status."
            actionLabel="Novo cliente"
            onAction={openCreateClient}
          />
        </Card>
      ) : (
        <List
          className="client-list"
          header={
            <div className="client-list__header">
              <span>Clientes encontrados</span>
              <Button size="mini" color="primary" fill="none" onClick={openCreateClient}>
                <AddOutline />
                Novo
              </Button>
            </div>
          }
        >
          {clients.map((client) => {
            const description = [formatPhone(client.phone) || 'Sem telefone cadastrado', client.email].filter(Boolean).join(' · ');

            return (
              <List.Item
                key={client.id}
                className={client.id === selectedClient?.id ? 'client-list__item client-list__item--selected' : 'client-list__item'}
                prefix={
                  <span className="client-list__avatar" aria-hidden="true">
                    <UserOutline />
                  </span>
                }
                description={<Ellipsis content={description} />}
                onClick={() => setSelectedClientId(client.id)}
              >
                <Ellipsis content={client.name} />
              </List.Item>
            );
          })}
        </List>
      )}

      <Space>
        <Button color="primary" fill="solid" size="large" shape="rounded" onClick={openCreateClient}>
          <UserAddOutline />
          Novo cliente
        </Button>
      </Space>

      <ClientProfileSheet
        visible={Boolean(selectedClient)}
        client={selectedClient}
        appointmentCount={selectedClientAppointments.length}
        attendanceCount={selectedClientAttendances.length}
        lastAttendanceLabel={lastClientAttendance ? formatAttendanceDate(lastClientAttendance.date) : null}
        nextAppointmentLabel={nextClientAppointment ? formatAppointmentDate(nextClientAppointment.date) : null}
        onClose={() => setSelectedClientId(null)}
        onCreateAppointment={() => goToRoute('agenda')}
        onCreateAttendance={() => goToRoute('atendimentos')}
        onEditClient={() => {
          if (!selectedClient) {
            return;
          }

          openEditClient(selectedClient);
        }}
      />

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
              normalize={(value) => formatPhone(String(value ?? ''))}
              rules={[{ required: true, message: 'Informe o telefone.' }]}
            >
              <Input type="tel" inputMode="tel" placeholder="(11) 99999-9999" maxLength={15} clearable />
            </Form.Item>

            <Form.Item name="email" label="E-mail">
              <Input
                type="email"
                inputMode="email"
                placeholder="cliente@email.com"
                autoComplete="email"
                autoCapitalize="none"
                clearable
              />
            </Form.Item>

            <div className="appointment-form-group">
              <div className="appointment-form-group__label">Data de nascimento</div>
              <DatePicker
                value={selectedBirthDate}
                onConfirm={(nextDate) => setSelectedBirthDate(nextDate)}
                title="Selecionar data de nascimento"
                confirmText="Selecionar"
                cancelText="Cancelar"
              >
                {(_, actions) => (
                  <Button shape="rounded" fill="outline" onClick={actions.open}>
                    {formatDateLabel(selectedBirthDate)}
                  </Button>
                )}
              </DatePicker>
            </div>

            <Form.Item name="notes" label="Observações">
              <TextArea rows={4} placeholder="Preferências, detalhes importantes ou observações curtas" />
            </Form.Item>

            <Form.Item name="active" label="Cliente ativo" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>

          <div className="client-form-footer">
            <Button onClick={closeEditor}>
              Cancelar
            </Button>
            <Button color="primary" fill="solid" onClick={handleSubmit} loading={submitting}>
              {editingClient ? 'Salvar alterações' : 'Criar cliente'}
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
}
