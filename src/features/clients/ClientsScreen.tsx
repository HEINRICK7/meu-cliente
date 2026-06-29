import { AddOutline, UserAddOutline } from 'antd-mobile-icons';
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
import { ClientCard } from '../../components/ClientCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { QuickActionButton } from '../../components/QuickActionButton';
import {
  createClient,
  listClients,
  searchClients,
  updateClient,
} from '../../services/mockData';
import type { Client, ClientStatus, ClientUpsertInput } from '../../types/domain';

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
    phone: values.phone.trim(),
    email: values.email?.trim() || undefined,
    birthDate: values.birthDate?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    status: values.active ? 'ativo' : 'inativo',
  };
}

export function ClientsScreen() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'todos' | ClientStatus>('todos');
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form] = Form.useForm<ClientFormValues>();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 350);

    return () => window.clearTimeout(timer);
  }, []);

  const allClients = useMemo(() => listClients(), [refreshToken]);
  const clients = useMemo(() => searchClients(query, status), [query, status, refreshToken]);

  const selectedClient =
    clients.find((client) => client.id === selectedClientId) ?? clients[0] ?? null;

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
    try {
      const values = await form.validateFields();
      const payload = clientFormToPayload(values as ClientFormValues);
      const savedClient = editingClient
        ? updateClient(editingClient.id, payload)
        : createClient(payload);

      setRefreshToken((current) => current + 1);
      setSelectedClientId(savedClient?.id ?? null);
      closeEditor();
      Toast.show({
        content: editingClient ? 'Cliente atualizado.' : 'Cliente criado.',
      });
    } catch {
      // Validation already explains what is missing.
    }
  }

  function handleQuickAction(action: string) {
    Toast.show({ content: `${action} será integrado depois.` });
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
          <Button
            color="primary"
            fill="solid"
            size="small"
            shape="rounded"
            onClick={openCreateClient}
          >
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

      {selectedClient ? (
        <Card className="soft-card highlight-card highlight-card--yellow">
          <div className="section-head">
            <div>
              <div className="section-label">Perfil rápido</div>
              <div className="section-title">{selectedClient.name}</div>
            </div>
          </div>

          <div className="client-card__meta">
            <span>{selectedClient.phone}</span>
            <span>{selectedClient.email ?? 'Sem e-mail cadastrado'}</span>
            <span>{selectedClient.lastAttendance ?? 'Sem atendimento ainda'}</span>
            <span>{selectedClient.nextAppointment ?? 'Sem agendamento'}</span>
            {selectedClient.notes ? <span>{selectedClient.notes}</span> : null}
          </div>

          <div className="quick-actions-grid client-detail-actions">
            <QuickActionButton
              label="Agendar"
              hint="Criar horário"
              onClick={() => handleQuickAction('Agendamento')}
              tone="primary"
            />
            <QuickActionButton
              label="Atendimento"
              hint="Registrar agora"
              onClick={() => handleQuickAction('Atendimento')}
            />
          </div>

          <Button block shape="rounded" style={{ marginTop: 12 }} onClick={() => openEditClient(selectedClient)}>
            Editar cliente
          </Button>
        </Card>
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

          <Form
            form={form}
            layout="vertical"
            initialValues={{ active: true }}
          >
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
            <Button color="primary" fill="solid" block onClick={handleSubmit}>
              {editingClient ? 'Salvar alterações' : 'Criar cliente'}
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
}
