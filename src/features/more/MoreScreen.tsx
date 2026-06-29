import {
  FileOutline,
  LinkOutline,
  QuestionCircleOutline,
  UserOutline,
} from 'antd-mobile-icons';
import { Button, Card, List, Toast } from 'antd-mobile';
import { useOrganization } from '../../hooks/useOrganization';
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

export function MoreScreen({ onLogout, session }: MoreScreenProps) {
  const { businessProfile, userProfile } = useOrganization(session?.id ?? null, session?.businessId ?? null);
  const businessName = businessProfile?.name || session?.businessName || 'Meu Cliente';
  const businessLabel = session?.role === 'owner' ? 'Conta principal' : 'Conta conectada';
  const userLabel = userProfile?.name || session?.name || 'Usuário';
  const userEmail = userProfile?.email || session?.email || '';
  const userRole = userProfile?.role || session?.role || 'owner';
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

  return (
    <div className="screen-stack">
      <Card className="soft-card highlight-card">
        <div className="section-head">
          <div className="more-account">
            <div className="more-account__avatar">
              {userPhoto ? (
                <img src={userPhoto} alt="" aria-hidden="true" className="more-account__image" />
              ) : (
                <span>{userInitials || 'MC'}</span>
              )}
            </div>
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
        <div className="more-meta-grid">
          <div>
            <strong>{roleLabel}</strong>
            <span>Papel</span>
          </div>
          <div>
            <strong>{businessSegment}</strong>
            <span>Segmento</span>
          </div>
          <div>
            <strong>{businessLabel}</strong>
            <span>Conta</span>
          </div>
        </div>
        <p className="muted-text">ID do negócio: {session?.businessId}</p>
        <Button
          block
          color="primary"
          fill="solid"
          shape="rounded"
          style={{ marginTop: 12 }}
          onClick={() => copyText(session?.businessId ?? '', 'ID do negócio')}
        >
          <LinkOutline />
          Copiar ID do negócio
        </Button>
      </Card>

      <Card className="soft-card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <div>
            <div className="section-label">Permissões básicas</div>
            <div className="section-title">Owner, admin e attendant</div>
          </div>
        </div>
        <div className="permission-list">
          <div>
            <strong>Owner</strong>
            <span>Controla a conta, o negócio e as configurações principais.</span>
          </div>
          <div>
            <strong>Admin</strong>
            <span>Gerencia rotina operacional, clientes, agenda e atendimentos.</span>
          </div>
          <div>
            <strong>Atendente</strong>
            <span>Foco na operação diária, com acesso simplificado ao MVP.</span>
          </div>
        </div>
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
    </div>
  );
}
