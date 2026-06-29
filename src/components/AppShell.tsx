import {
  CalendarOutline,
  BellOutline,
  MessageOutline,
  MoreOutline,
  UnorderedListOutline,
  UserOutline,
  AddCircleOutline,
} from 'antd-mobile-icons';
import { Button, Empty, Popup } from 'antd-mobile';
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
              <button
                type="button"
                className="app-header__avatar-button"
                aria-label={`Abrir conta de ${userName}`}
                onClick={() => onNavigate('mais')}
              >
                <div className="app-user-chip__avatar">
                  {userPhoto ? (
                    <img src={userPhoto} alt="" aria-hidden="true" className="app-user-chip__image" />
                  ) : (
                    <span>{shortName(userName)}</span>
                  )}
                </div>
              </button>
              <button
                type="button"
                className="icon-chip icon-chip--light"
                aria-label="Abrir notificações"
                onClick={() => setNotificationsVisible(true)}
              >
                <BellOutline />
                {notificationCount > 0 ? <span className="app-header__badge">{notificationCount}</span> : null}
              </button>
            </div>
          </div>

          <div className="app-header__copy">
            <div className="app-header__title">{meta.title}</div>
            <div className="app-header__subtitle">{meta.subtitle}</div>
          </div>
        </header>

        <main className="app-content">{children}</main>

        <nav className="bottom-nav" aria-label="Navegação principal">
          {navItems.slice(0, 2).map((item) => {
            const isActive = item.route === activeRoute;

            return (
              <button
                key={item.route}
                type="button"
                className={isActive ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'}
                onClick={() => onNavigate(item.route)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="bottom-nav__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            className="bottom-nav__create"
            onClick={() => onNavigate('atendimentos')}
            aria-label="Abrir atendimentos"
          >
            <AddCircleOutline />
          </button>
          {navItems.slice(2).map((item) => {
            const isActive = item.route === activeRoute;

            return (
              <button
                key={item.route}
                type="button"
                className={isActive ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'}
                onClick={() => onNavigate(item.route)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="bottom-nav__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

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
              <div className="notifications-list">
                {previewNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    className="notification-item"
                    onClick={() => {
                      setNotificationsVisible(false);
                      onNavigate(notification.route);
                    }}
                  >
                    <div className="notification-item__copy">
                      <strong>{notification.title}</strong>
                      <span>{notification.description}</span>
                    </div>
                    <span className="notification-item__action">{notification.actionLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Popup>
      </div>
    </div>
  );
}
