import {
  FileOutline,
  QuestionCircleOutline,
  SetOutline,
  UserOutline,
} from 'antd-mobile-icons';
import { Button, Card, List, Toast } from 'antd-mobile';
import type { AuthSession } from '../../types/domain';

const actions = [
  { title: 'Configurações', icon: <SetOutline /> },
  { title: 'Preferências de agenda', icon: <FileOutline /> },
  { title: 'Modelos rápidos', icon: <FileOutline /> },
  { title: 'Ajuda', icon: <QuestionCircleOutline /> },
  { title: 'Sair', icon: <QuestionCircleOutline /> },
];

type MoreScreenProps = {
  onLogout?: () => void;
  session?: AuthSession | null;
};

export function MoreScreen({ onLogout, session }: MoreScreenProps) {
  const businessName = session?.businessName || 'Meu Cliente';
  const businessLabel = session?.role === 'owner' ? 'Conta principal' : 'Conta conectada';
  const userLabel = session?.name || 'Usuário';
  const userEmail = session?.email || '';

  return (
    <div className="screen-stack">
      <Card className="soft-card highlight-card">
        <div className="section-head">
          <div>
            <div className="section-label">Conta</div>
            <div className="section-title">{businessName}</div>
          </div>
        </div>
        <p className="muted-text">{businessLabel}</p>
        <p className="muted-text" style={{ marginTop: 8 }}>
          {userLabel}
          {userEmail ? ` · ${userEmail}` : ''}
        </p>
        <Button
          block
          color="primary"
          fill="solid"
          shape="rounded"
          style={{ marginTop: 12 }}
          onClick={() => {
            Toast.show({ content: 'Perfil da conta será integrado depois.' });
          }}
        >
          <UserOutline />
          Ver perfil da conta
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

                Toast.show({ content: `${action.title} será implementado depois.` });
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
