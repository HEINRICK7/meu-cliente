import {
  CalendarOutline,
  BellOutline,
  MoreOutline,
  UnorderedListOutline,
  UserOutline,
  AddCircleOutline,
} from 'antd-mobile-icons';
import { Avatar, Badge, Button, Empty, List, Popup, SafeArea, TabBar } from 'antd-mobile';
import { useMemo, useState, type ReactNode } from 'react';
import type { AppRoute, AuthSession } from '../types/domain';

export type ShellNotification = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  route: AppRoute;
};

type AppShellProps = {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  children: ReactNode;
  session?: AuthSession | null;
  notifications?: ShellNotification[];
};

const navItems: Array<{ route: AppRoute; label: string; icon: ReactNode }> = [
  { route: 'inicio', label: 'Início', icon: <CalendarOutline /> },
  { route: 'agenda', label: 'Agenda', icon: <UnorderedListOutline /> },
  { route: 'atendimentos', label: 'Atender', icon: <AddCircleOutline /> },
  { route: 'clientes', label: 'Clientes', icon: <UserOutline /> },
  { route: 'mais', label: 'Mais', icon: <MoreOutline /> },
];

const pageMeta: Record<AppRoute, { title: string; subtitle: string }> = {
  inicio: {
    title: 'Início',
    subtitle: 'Resumo do dia e ações mais importantes.',
  },
  clientes: {
    title: 'Clientes',
    subtitle: 'Encontrar e abrir um cliente sem complicação.',
  },
  agenda: {
    title: 'Agenda',
    subtitle: 'Hoje, próximos compromissos e visão da semana.',
  },
  atendimentos: {
    title: 'Atendimentos',
    subtitle: 'Registro rápido do que foi feito.',
  },
  mais: {
    title: 'Mais',
    subtitle: 'Configurações, apoio e informações da conta.',
  },
};

function shortName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function AppShell({ activeRoute, onNavigate, children, session, notifications = [] }: AppShellProps) {
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const meta = pageMeta[activeRoute];
  const userName = session?.name || 'Usuário';
  const userPhoto = session?.photoURL;
  const notificationCount = notifications.length;
  const previewNotifications = useMemo(() => notifications.slice(0, 4), [notifications]);

  return (
    <div className="app-frame">
      <div className="app-shell">
        <header className="app-header app-header--compact">
          <SafeArea position="top" />
          <div className="app-header__topbar">
            <div className="app-header__brand">
              <div className="app-header__brand-badge">
                <img
                  src="/brand/app-logo-mark.png"
                  alt=""
                  className="app-header__brand-image"
                  aria-hidden="true"
                />
              </div>
              <div className="app-header__brand-copy" aria-label="Meu Cliente">
                <span>MEU</span>
                <span>CLIENTE</span>
              </div>
            </div>
            <div className="app-header__actions">
              <Button
                fill="none"
                className="app-header__avatar-button"
                aria-label={`Abrir conta de ${userName}`}
                onClick={() => onNavigate('mais')}
              >
                <Avatar
                  className="app-user-chip__avatar"
                  src={userPhoto || ''}
                  fallback={shortName(userName)}
                />
              </Button>
              <Button
                fill="none"
                className="icon-chip icon-chip--light"
                aria-label="Abrir notificações"
                onClick={() => setNotificationsVisible(true)}
              >
                <Badge content={notificationCount > 0 ? notificationCount : null}>
                  <BellOutline />
                </Badge>
              </Button>
            </div>
          </div>

          <div className="app-header__copy">
            <div className="app-header__title">{meta.title}</div>
            <div className="app-header__subtitle">{meta.subtitle}</div>
          </div>
        </header>

        <main className="app-content">{children}</main>

        <TabBar
          className="bottom-nav"
          activeKey={activeRoute}
          onChange={(key) => onNavigate(key as AppRoute)}
          safeArea
        >
          {navItems.map((item) => (
            <TabBar.Item key={item.route} icon={item.icon} title={item.label} />
          ))}
        </TabBar>
        <SafeArea position="bottom" />

        <Popup
          visible={notificationsVisible}
          onMaskClick={() => setNotificationsVisible(false)}
          position="bottom"
          bodyStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: '58vh' }}
        >
          <div className="notifications-sheet">
            <div className="auth-popup__handle" />
            <div className="section-head">
              <div>
                <div className="section-label">Sistema</div>
                <div className="section-title">Notificações do dia</div>
              </div>
              <Button size="small" fill="outline" shape="rounded" onClick={() => setNotificationsVisible(false)}>
                Fechar
              </Button>
            </div>

            {previewNotifications.length === 0 ? (
              <Empty description="Nenhum lembrete agora. A agenda está tranquila." />
            ) : (
              <List className="notifications-list">
                {previewNotifications.map((notification) => (
                  <List.Item
                    key={notification.id}
                    className="notification-item"
                    onClick={() => {
                      setNotificationsVisible(false);
                      onNavigate(notification.route);
                    }}
                    extra={<span className="notification-item__action">{notification.actionLabel}</span>}
                  >
                    <div className="notification-item__copy">
                      <strong>{notification.title}</strong>
                      <span>{notification.description}</span>
                    </div>
                  </List.Item>
                ))}
              </List>
            )}
          </div>
        </Popup>
      </div>
    </div>
  );
}
