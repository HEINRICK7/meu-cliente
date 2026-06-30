import {
  AddOutline,
  ChatAddOutline,
  ClockCircleOutline,
  EditSOutline,
  MessageOutline,
} from 'antd-mobile-icons';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  List,
  Popup,
  Selector,
  Space,
  Toast,
  TextArea,
} from 'antd-mobile';
import { useMemo, useState } from 'react';
import { AttendanceCard } from '../../components/AttendanceCard';
import { AttachmentsPanel } from '../../components/AttachmentsPanel';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { useAttendances } from '../../hooks/useAttendances';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import { useClients } from '../../hooks/useClients';
import { formatAttendanceDate, isAttendanceOnDay } from '../../services/attendancesService';
import { formatAppointmentDate } from '../../services/appointmentsService';
import { parseCalendarDate, toDateKey } from '../../utils/date';
import type { Attendance, AttendanceUpsertInput } from '../../types/domain';

type AttendanceFormValues = {
  title: string;
  description: string;
  nextAction?: string;
};

function formatDateLabel(date: Date | null) {
  if (!date) {
    return 'Selecionar data';
  }

  return date.toLocaleDateString('pt-BR');
}

function goToRoute(route: 'clientes' | 'agenda') {
  if (typeof window !== 'undefined') {
    window.location.hash = `#/${route}`;
  }
}

export function AttendancesScreen() {
  const { session } = useAuth();
  const { clients } = useClients(session?.businessId ?? null, session?.id ?? null);
  const { attendances, loading, error, createAttendance, updateAttendance } = useAttendances(
    session?.businessId ?? null,
    session?.id ?? null,
  );
  const { appointments } = useAppointments(session?.businessId ?? null, session?.id ?? null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<AttendanceFormValues>();

  const todayAttendances = useMemo(
    () => attendances.filter((attendance) => isAttendanceOnDay(attendance.date)),
    [attendances],
  );

  const followUps = useMemo(
    () => attendances.filter((attendance) => Boolean(attendance.nextAction || attendance.returnDate)),
    [attendances],
  );

  const recentClients = useMemo(() => clients.slice(0, 8), [clients]);
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );
  const selectedClientAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.clientId === selectedClientId).slice(0, 8),
    [appointments, selectedClientId],
  );
  const lastAttendance = attendances[0] || null;

  function resetEditorState() {
    setSelectedClientId(null);
    setSelectedAppointmentId(null);
    setSelectedDate(new Date());
    form.resetFields();
    form.setFieldsValue({
      title: 'Sessão realizada',
      description: '',
      nextAction: '',
    });
  }

  function openCreateAttendance() {
    setEditingAttendance(null);
    resetEditorState();

    if (recentClients[0]) {
      setSelectedClientId(recentClients[0].id);
    }

    setEditorVisible(true);
  }

  function openQuickTemplate() {
    openCreateAttendance();
    form.setFieldsValue({
      title: 'Sessão realizada',
      description: 'Resumo rápido do atendimento realizado hoje.',
      nextAction: 'Retorno conforme combinado',
    });
  }

  function openEditAttendance(attendance: Attendance) {
    setEditingAttendance(attendance);
    setSelectedClientId(attendance.clientId);
    setSelectedAppointmentId(attendance.appointmentId ?? null);
    setSelectedDate(parseCalendarDate(attendance.date));
    form.setFieldsValue({
      title: attendance.title,
      description: attendance.description,
      nextAction: attendance.nextAction ?? '',
    });
    setEditorVisible(true);
  }

  function closeEditor() {
    setEditorVisible(false);
    setEditingAttendance(null);
    resetEditorState();
  }

  function handleClientSelection(values: string[]) {
    const nextClientId = values[0] ?? null;
    setSelectedClientId(nextClientId);
    setSelectedAppointmentId(null);
  }

  async function handleSaveAttendance() {
    if (!session) {
      Toast.show({ content: 'Faça login novamente para continuar.' });
      return;
    }

    try {
      setSaving(true);
      const values = await form.validateFields();

      if (!selectedClient) {
        Toast.show({ content: 'Selecione um cliente para o atendimento.' });
        return;
      }

      if (!selectedDate) {
        Toast.show({ content: 'Selecione a data do atendimento.' });
        return;
      }

      const payload: AttendanceUpsertInput = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        appointmentId: selectedAppointmentId || undefined,
        date: toDateKey(selectedDate),
        title: values.title.trim(),
        description: values.description.trim(),
        nextAction: values.nextAction?.trim() || undefined,
      };

      if (editingAttendance) {
        await updateAttendance(editingAttendance.id, payload);
      } else {
        await createAttendance(payload, session.id);
      }

      Toast.show({
        content: editingAttendance ? 'Atendimento atualizado.' : 'Atendimento registrado.',
      });
      closeEditor();
    } catch {
      // Validation already explains what is missing.
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState lines={3} />;
  }

  return (
    <div className="screen-stack">
      <Card className="soft-card hero-meeting-card hero-meeting-card--attendance">
        <div className="section-head">
          <div>
            <div className="section-label">Atendimento rápido</div>
            <div className="section-title">Registrar o que foi feito hoje</div>
          </div>
          <Button color="primary" fill="solid" size="small" shape="rounded" onClick={openCreateAttendance}>
            <ChatAddOutline />
            Registrar
          </Button>
        </div>
        <div className="mini-summary-grid">
          <div>
            <strong>{attendances.length}</strong>
            <span>Registros</span>
          </div>
          <div>
            <strong>{todayAttendances.length}</strong>
            <span>Hoje</span>
          </div>
          <div>
            <strong>{followUps.length}</strong>
            <span>Próxima ação</span>
          </div>
        </div>
          <div className="quick-actions-grid" style={{ marginTop: 16 }}>
          <Button block color="primary" fill="solid" shape="rounded" onClick={openCreateAttendance}>
            <ChatAddOutline />
            Registrar atendimento
          </Button>
          <Button block color="primary" fill="outline" shape="rounded" onClick={openQuickTemplate}>
            <ClockCircleOutline />
            Modelo rápido
          </Button>
        </div>
      </Card>

      {error ? <EmptyState title="Erro ao carregar atendimentos" description={error} /> : null}

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Últimos registros</div>
            <div className="section-title">Histórico recente</div>
          </div>
          <Button size="small" color="primary" fill="solid" shape="rounded" onClick={openCreateAttendance}>
            <AddOutline />
            Novo
          </Button>
        </div>

        {!error && attendances.length === 0 ? (
          <EmptyState
            title="Nenhum atendimento salvo"
            description="Registros de atendimento aparecem aqui em cards simples."
            actionLabel="Registrar atendimento"
            onAction={openCreateAttendance}
          />
        ) : (
          <div className="screen-stack">
            {attendances.map((attendance) => (
              <AttendanceCard
                key={attendance.id}
                attendance={attendance}
                onClick={() => openEditAttendance(attendance)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="soft-card">
        <div className="section-head">
          <div>
            <div className="section-label">Atalho</div>
            <div className="section-title">Próximos passos</div>
          </div>
        </div>
        <List className="compact-list">
          <List.Item
            onClick={() => goToRoute('clientes')}
          >
            <span className="more-list__item">
              <MessageOutline />
              <span>Abrir clientes</span>
            </span>
          </List.Item>
          <List.Item
            onClick={openQuickTemplate}
          >
            <span className="more-list__item">
              <EditSOutline />
              <span>Editar modelo rápido</span>
            </span>
          </List.Item>
        </List>
      </Card>

      <Button
        block
        color="primary"
        fill="outline"
        shape="rounded"
        onClick={openQuickTemplate}
      >
        Criar modelo rápido
      </Button>

      <Popup
        visible={editorVisible}
        position="bottom"
        onMaskClick={closeEditor}
        bodyStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: '84vh' }}
      >
        <div className="appointment-form-sheet">
          <div className="section-head">
            <div>
              <div className="section-label">{editingAttendance ? 'Editar atendimento' : 'Novo atendimento'}</div>
              <div className="section-title">
                {editingAttendance ? editingAttendance.clientName : 'Registro rápido e simples'}
              </div>
            </div>
          </div>

          <div className="appointment-form-group">
            <div className="appointment-form-group__label">Cliente</div>
            {recentClients.length === 0 ? (
              <p className="muted-text">Nenhum cliente cadastrado ainda.</p>
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
              name="title"
              label="Título"
              rules={[{ required: true, message: 'Informe o título.' }]}
            >
              <Input placeholder="Ex.: Sessão realizada" clearable />
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

            <div className="appointment-form-group">
              <div className="appointment-form-group__label">Agendamento vinculado</div>
              {!selectedClient ? (
                <p className="muted-text">Selecione um cliente para ver os agendamentos.</p>
              ) : selectedClientAppointments.length === 0 ? (
                <p className="muted-text">Nenhum agendamento encontrado para este cliente.</p>
              ) : (
                <Selector
                  value={selectedAppointmentId ? [selectedAppointmentId] : []}
                  options={selectedClientAppointments.map((appointment) => ({
                    value: appointment.id,
                    label: (
                      <div className="appointment-selector__item">
                        <strong>{appointment.serviceType}</strong>
                        <span>
                          {formatAppointmentDate(appointment.date)} às {appointment.time}
                        </span>
                      </div>
                    ),
                  }))}
                  columns={1}
                  onChange={(values) => setSelectedAppointmentId(values[0] ?? null)}
                />
              )}
            </div>

            <Form.Item
              name="description"
              label="Descrição"
              rules={[{ required: true, message: 'Descreva o atendimento.' }]}
            >
              <TextArea rows={4} placeholder="Resumo curto do que foi feito" />
            </Form.Item>

            <Form.Item name="nextAction" label="Próxima ação">
              <Input placeholder="Ex.: retorno em 15 dias" clearable />
            </Form.Item>
          </Form>

          <AttachmentsPanel
            title="Anexos do atendimento"
            description="Arquivos ligados ao atendimento ou ao cliente selecionado."
            businessId={session?.businessId ?? null}
            ownerId={session?.id ?? null}
            clientId={selectedClientId}
            attendanceId={editingAttendance?.id ?? null}
            emptyTitle="Nenhum anexo neste atendimento"
            emptyDescription="Anexe imagens ou documentos para manter o registro completo."
          />

          <Space direction="vertical" block>
            <Button
              color="primary"
              fill="solid"
              block
              size="large"
              shape="rounded"
              loading={saving}
              onClick={handleSaveAttendance}
            >
              {editingAttendance ? 'Salvar alterações' : 'Registrar atendimento'}
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
