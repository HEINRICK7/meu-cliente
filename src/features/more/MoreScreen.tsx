import {
  BellOutline,
  FileOutline,
  LinkOutline,
  QuestionCircleOutline,
  UserOutline,
} from 'antd-mobile-icons';
import { Avatar, Button, Card, Footer, Form, Grid, Input, List, Popup, Space, Toast } from 'antd-mobile';
import { useEffect, useState } from 'react';
import { useOrganization } from '../../hooks/useOrganization';
import { updateBusinessProfileRecord, updateUserProfileRecord } from '../../services/organizationService';
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushNotificationErrorMessage,
  getPushPermissionStatus,
} from '../../services/pushNotificationsService';
import { isFirestoreUnavailableError } from '../../services/firestoreHealth';
import { isFormValidationError } from '../../utils/form';
import type { AuthSession } from '../../types/domain';

const actions = [
  { title: 'Copiar ID do negócio', icon: <LinkOutline /> },
  { title: 'Copiar e-mail', icon: <FileOutline /> },
  { title: 'Copiar nome', icon: <UserOutline /> },
  { title: 'Sair', icon: <QuestionCircleOutline /> },
];

type MoreScreenProps = {
  onLogout?: () => void;
  session?: AuthSession | null;
};

type AccountFormValues = {
  name: string;
  businessName: string;
  segment: string;
};

function getProfileSaveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error !== 'object' || error === null) {
    return 'Não foi possível salvar o perfil.';
  }

  const code = 'code' in error ? String((error as { code?: string }).code) : '';

  if (code.includes('permission-denied')) {
    return 'Sem permissão para salvar este perfil. Verifique as regras do Firebase.';
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

  return 'Não foi possível salvar o perfil. Tente novamente.';
}

export function MoreScreen({ onLogout, session }: MoreScreenProps) {
  const { businessProfile, userProfile } = useOrganization(session?.id ?? null, session?.businessId ?? null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [pushPermission, setPushPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [pushSaving, setPushSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<AccountFormValues>();
  const businessName = businessProfile?.name || session?.businessName || 'Meu Cliente';
  const businessLabel = session?.role === 'owner' ? 'Conta principal' : 'Conta conectada';
  const userLabel = userProfile?.name || session?.name || 'Usuário';
  const userEmail = userProfile?.email || session?.email || '';
  const userRole = userProfile?.role || session?.role || 'owner';
  const pushEnabled = Boolean(userProfile?.pushToken && userProfile?.pushNotificationsEnabled);
  const businessSegment = businessProfile?.segment || 'Serviços';
  const userPhoto = session?.photoURL;
  const userInitials = userLabel
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const roleLabel = {
    owner: 'Owner',
    admin: 'Admin',
    attendant: 'Atendente',
  }[userRole];

  useEffect(() => {
    if (!profileVisible) {
      return;
    }

    form.setFieldsValue({
      name: userLabel,
      businessName,
      segment: businessSegment,
    });
  }, [businessName, businessSegment, form, profileVisible, userLabel]);

  useEffect(() => {
    void (async () => {
      try {
        setPushPermission(await getPushPermissionStatus());
      } catch {
        setPushPermission('denied');
      }
    })();
  }, []);

  async function copyText(value: string, label: string) {
    if (!value) {
      Toast.show({ content: `Sem ${label.toLowerCase()} para copiar.` });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      Toast.show({ content: `${label} copiado.` });
    } catch {
      Toast.show({ content: `Não foi possível copiar ${label.toLowerCase()}.` });
    }
  }

  function openProfileEditor() {
    form.setFieldsValue({
      name: userLabel,
      businessName,
      segment: businessSegment,
    });
    setProfileVisible(true);
  }

  async function handleSaveProfile() {
    if (!session) {
      Toast.show({ content: 'Faça login novamente para continuar.' });
      return;
    }

    try {
      setSaving(true);
      const values = await form.validateFields();

      await updateUserProfileRecord(session.id, {
        name: values.name.trim(),
      });
      await updateBusinessProfileRecord(session.businessId, {
        name: values.businessName.trim(),
        segment: values.segment.trim(),
      });

      Toast.show({ content: 'Perfil atualizado.' });
      setProfileVisible(false);
    } catch (error) {
      if (!isFormValidationError(error)) {
        Toast.show({ content: getProfileSaveErrorMessage(error) });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePushNotifications() {
    if (!session) {
      Toast.show({ content: 'Faça login novamente para continuar.' });
      return;
    }

    try {
      setPushSaving(true);

      if (pushEnabled) {
        await disablePushNotifications(session.id);
        Toast.show({ content: 'Notificações desativadas neste aparelho.' });
      } else {
        if (pushPermission === 'denied') {
          Toast.show({
            content: 'As notificações estão bloqueadas no navegador. Libere a permissão nas configurações do site.',
          });
          return;
        }

        await enablePushNotifications(session.id);
        Toast.show({ content: 'Notificações ativadas neste aparelho.' });
      }

      setPushPermission(await getPushPermissionStatus());
    } catch (error) {
      Toast.show({ content: getPushNotificationErrorMessage(error) });
    } finally {
      setPushSaving(false);
    }
  }

  return (
    <div className="screen-stack">
      <Card className="soft-card highlight-card">
        <div className="section-head">
          <div className="more-account">
            <Avatar className="more-account__avatar" src={userPhoto || ''} fallback={userInitials || 'MC'} />
            <div>
              <div className="section-label">Conta</div>
              <div className="section-title">{businessName}</div>
              <p className="muted-text" style={{ marginTop: 6 }}>
                {userLabel}
                {userEmail ? ` · ${userEmail}` : ''}
              </p>
            </div>
          </div>
        </div>
        <Grid columns={3} gap={10} className="more-meta-grid">
          <Grid.Item>
            <strong>{roleLabel}</strong>
            <span>Papel</span>
          </Grid.Item>
          <Grid.Item>
            <strong>{businessSegment}</strong>
            <span>Segmento</span>
          </Grid.Item>
          <Grid.Item>
            <strong>{businessLabel}</strong>
            <span>Conta</span>
          </Grid.Item>
        </Grid>
        <p className="muted-text">ID do negócio: {session?.businessId}</p>
        <Button
          color="primary"
          fill="solid"
          shape="rounded"
          style={{ marginTop: 12 }}
          onClick={openProfileEditor}
        >
          <UserOutline />
          Ver e editar perfil
        </Button>
      </Card>

      <Card className="soft-card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <div>
            <div className="section-label">Permissões básicas</div>
            <div className="section-title">Owner, admin e attendant</div>
          </div>
        </div>
        <Grid columns={1} gap={10} className="permission-list">
          <Grid.Item>
            <strong>Owner</strong>
            <span>Controla a conta, o negócio e as configurações principais.</span>
          </Grid.Item>
          <Grid.Item>
            <strong>Admin</strong>
            <span>Gerencia rotina operacional, clientes, agenda e atendimentos.</span>
          </Grid.Item>
          <Grid.Item>
            <strong>Atendente</strong>
            <span>Foco na operação diária, com acesso simplificado ao MVP.</span>
          </Grid.Item>
        </Grid>
      </Card>

      <Card className="soft-card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <div>
            <div className="section-label">Notificações</div>
            <div className="section-title">Push do sistema</div>
          </div>
        </div>
        <Grid columns={1} gap={10} className="permission-list">
          <Grid.Item>
            <strong>
              {pushEnabled ? 'Ativas neste aparelho' : 'Desativadas neste aparelho'}
            </strong>
            <span>
              {pushPermission === 'granted'
                ? 'O navegador permite notificações.'
                : pushPermission === 'denied'
                  ? 'O navegador bloqueou notificações para este site.'
                  : 'Ative as notificações para receber lembretes e avisos do sistema.'}
            </span>
          </Grid.Item>
        </Grid>
        <Button
          color="primary"
          fill={pushEnabled ? 'outline' : 'solid'}
          shape="rounded"
          style={{ marginTop: 12 }}
          loading={pushSaving}
          onClick={handleTogglePushNotifications}
        >
          <BellOutline />
          {pushEnabled ? 'Desativar notificações' : 'Ativar notificações'}
        </Button>
      </Card>

      <Card className="soft-card">
        <List className="compact-list">
          {actions.map((action) => (
            <List.Item
              key={action.title}
              onClick={() => {
                if (action.title === 'Sair') {
                  if (onLogout) {
                    onLogout();
                    return;
                  }

                  Toast.show({ content: 'Saindo da conta...' });
                  return;
                }

                if (action.title === 'Copiar ID do negócio') {
                  void copyText(session?.businessId ?? '', 'ID do negócio');
                  return;
                }

                if (action.title === 'Copiar e-mail') {
                  void copyText(userEmail, 'E-mail');
                  return;
                }

                void copyText(userLabel, 'Nome');
              }}
            >
              <span className="more-list__item">
                {action.icon}
                <span>{action.title}</span>
              </span>
            </List.Item>
          ))}
        </List>
      </Card>

      <Footer label="Meu Cliente" content="App mobile-first para clientes, agenda e atendimentos." />

      <Popup
        visible={profileVisible}
        position="bottom"
        onMaskClick={() => setProfileVisible(false)}
        bodyStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: '68vh' }}
      >
        <div className="appointment-form-sheet">
          <div className="section-head">
            <div>
              <div className="section-label">Perfil da conta</div>
              <div className="section-title">Dados do usuário e do negócio</div>
            </div>
          </div>

          <Form form={form} layout="vertical" className="appointment-form">
            <Form.Item
              name="name"
              label="Seu nome"
              rules={[{ required: true, message: 'Informe seu nome.' }]}
            >
              <Input placeholder="Nome completo" clearable />
            </Form.Item>

            <Form.Item
              name="businessName"
              label="Nome do negócio"
              rules={[{ required: true, message: 'Informe o nome do negócio.' }]}
            >
              <Input placeholder="Meu Cliente" clearable />
            </Form.Item>

            <Form.Item
              name="segment"
              label="Segmento"
              rules={[{ required: true, message: 'Informe o segmento.' }]}
            >
              <Input placeholder="Serviços" clearable />
            </Form.Item>
          </Form>

          <Space wrap className="form-action-row">
            <Button color="primary" fill="solid" size="large" shape="rounded" loading={saving} onClick={handleSaveProfile}>
              Salvar alterações
            </Button>
            <Button size="large" shape="rounded" onClick={() => setProfileVisible(false)}>
              Cancelar
            </Button>
          </Space>
        </div>
      </Popup>
    </div>
  );
}
