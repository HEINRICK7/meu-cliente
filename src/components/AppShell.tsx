import {
  AddOutline,
  BellOutline,
  CalendarOutline,
  MessageOutline,
  MoreOutline,
  UnorderedListOutline,
  UserOutline,
} from 'antd-mobile-icons';
import type { ReactNode } from 'react';
import type { AppRoute } from '../types/domain';

type AppShellProps = {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  children: ReactNode;
};

const navItems: Array<{ route: AppRoute; label: string; icon: ReactNode }> = [
  { route: 'inicio', label: 'Início', icon: <CalendarOutline /> },
  { route: 'clientes', label: 'Clientes', icon: <UserOutline /> },
  { route: 'agenda', label: 'Agenda', icon: <UnorderedListOutline /> },
  { route: 'atendimentos', label: 'Atendimentos', icon: <MessageOutline /> },
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

export function AppShell({ activeRoute, onNavigate, children }: AppShellProps) {
  const meta = pageMeta[activeRoute];
  return (
    <div className="app-frame">
      <div className="app-shell">
        <header className="app-header app-header--compact">
          <div className="app-header__topbar">
            <div className="app-header__brand">
              <div className="app-header__brand-badge">MC</div>
              <div>
                <div className="app-header__eyebrow">Meu Cliente</div>
                <div className="app-header__subtitle app-header__subtitle--brand">Organização simples do dia</div>
              </div>
            </div>
            <div className="app-header__actions" aria-hidden="true">
              <button type="button" className="icon-chip">
                <AddOutline />
              </button>
              <button type="button" className="icon-chip">
                <BellOutline />
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
          {navItems.map((item) => {
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
      </div>
    </div>
  );
}
