import { useEffect, useMemo, useState } from 'react';
import { Toast } from 'antd-mobile';
import { AppShell, type ShellNotification } from './components/AppShell';
import { LoadingState } from './components/LoadingState';
import { useAppointments } from './hooks/useAppointments';
import { useAttendances } from './hooks/useAttendances';
import { useAuth } from './hooks/useAuth';
import { useHashRoute } from './hooks/useHashRoute';
import { LoginScreen } from './features/auth/LoginScreen';
import { SignupScreen } from './features/auth/SignupScreen';
import { HomeScreen } from './features/home/HomeScreen';
import { ClientsScreen } from './features/clients/ClientsScreen';
import { ScheduleScreen } from './features/schedule/ScheduleScreen';
import { AttendancesScreen } from './features/attendances/AttendancesScreen';
import { MoreScreen } from './features/more/MoreScreen';
import {
  getAuthErrorMessage,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
} from './services/authService';
import { subscribeToForegroundPushes } from './services/pushNotificationsService';
import type { AuthFormValues } from './features/auth/AuthScreen';
import type { AppRoute, AuthRoute, Route } from './types/domain';
import { compareAppointmentsBySchedule, isAppointmentOnDay } from './services/appointmentsService';
import { toDateKey } from './utils/date';

function isAppRoute(route: Route): route is AppRoute {
  return route === 'inicio' || route === 'clientes' || route === 'agenda' || route === 'atendimentos' || route === 'mais';
}

function authRouteFrom(route: Route): AuthRoute {
  return route === 'cadastro' ? 'cadastro' : 'entrar';
}

export default function App() {
  const { route, navigate } = useHashRoute();
  const { session, loading } = useAuth();
  const { appointments } = useAppointments(session?.businessId ?? null, session?.id ?? null);
  const { attendances } = useAttendances(session?.businessId ?? null, session?.id ?? null);
  const [authBusy, setAuthBusy] = useState(false);
  const activeRoute = isAppRoute(route) ? route : 'inicio';
  const [mountedRoutes, setMountedRoutes] = useState<Record<AppRoute, boolean>>(() => ({
    inicio: activeRoute === 'inicio',
    clientes: activeRoute === 'clientes',
    agenda: activeRoute === 'agenda',
    atendimentos: activeRoute === 'atendimentos',
    mais: activeRoute === 'mais',
  }));

  useEffect(() => {
    if (loading) {
      return;
    }

    if (session && !isAppRoute(route)) {
      navigate('inicio');
      return;
    }

    if (!session && isAppRoute(route)) {
      navigate('entrar');
    }
  }, [loading, navigate, route, session]);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => undefined;

    void (async () => {
      unsubscribe = await subscribeToForegroundPushes((payload) => {
        if (!active) {
          return;
        }

        const title = payload.notification?.title || payload.data?.title || 'Meu Cliente';
        const body = payload.notification?.body || payload.data?.body || 'Nova notificação recebida.';

        Toast.show({
          content: body ? `${title}: ${body}` : title,
        });
      });
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAppRoute(route)) {
      return;
    }

    setMountedRoutes((current) => {
      if (current[route]) {
        return current;
      }

      return {
        ...current,
        [route]: true,
      };
    });
  }, [route]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('entrar');
    } catch {
      Toast.show({ content: 'Não foi possível sair agora.' });
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);

    try {
      const result = await signInWithGoogle();

      if (result.mode === 'popup') {
        navigate('inicio');
      }
    } catch (error) {
      Toast.show({ content: getAuthErrorMessage(error) });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleEmailLogin = async (values: AuthFormValues) => {
    setAuthBusy(true);

    try {
      await signInWithEmail(values.email, values.password);
      navigate('inicio');
    } catch (error) {
      Toast.show({ content: getAuthErrorMessage(error) });
      throw error;
    } finally {
      setAuthBusy(false);
    }
  };

  const handleEmailSignup = async (values: AuthFormValues) => {
    setAuthBusy(true);

    try {
      await signUpWithEmail(values.email, values.password, values.name || '');
      navigate('inicio');
    } catch (error) {
      Toast.show({ content: getAuthErrorMessage(error) });
      throw error;
    } finally {
      setAuthBusy(false);
    }
  };

  const notifications = useMemo<ShellNotification[]>(() => {
    if (!session) {
      return [];
    }

    const todayKey = toDateKey(new Date());
    const sortedAppointments = [...appointments].sort(compareAppointmentsBySchedule);
    const todayAppointments = sortedAppointments.filter((appointment) => isAppointmentOnDay(appointment.date));
    const upcomingAppointments = sortedAppointments.filter((appointment) => appointment.date > todayKey);
    const followUps = attendances.filter((attendance) => Boolean(attendance.nextAction || attendance.returnDate));

    const items: ShellNotification[] = [];

    if (todayAppointments[0]) {
      const nextToday = todayAppointments[0];
      items.push({
        id: `today-${nextToday.id}`,
        title: 'Compromisso de hoje',
        description: `${nextToday.time} • ${nextToday.clientName} • ${nextToday.serviceType}`,
        actionLabel: 'Abrir agenda',
        route: 'agenda',
      });
    }

    if (upcomingAppointments[0]) {
      const nextUpcoming = upcomingAppointments[0];
      items.push({
        id: `upcoming-${nextUpcoming.id}`,
        title: 'Próximo atendimento',
        description: `${nextUpcoming.date} • ${nextUpcoming.time} • ${nextUpcoming.clientName}`,
        actionLabel: 'Ver agenda',
        route: 'agenda',
      });
    }

    if (followUps[0]) {
      items.push({
        id: `follow-${followUps[0].id}`,
        title: 'Pendência registrada',
        description: followUps[0].nextAction || followUps[0].returnDate || 'Há uma próxima ação para revisar.',
        actionLabel: 'Abrir atendimentos',
        route: 'atendimentos',
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'empty-state',
        title: 'Tudo em ordem',
        description: 'Nenhum lembrete importante agora.',
        actionLabel: 'Abrir agenda',
        route: 'agenda',
      });
    }

    return items;
  }, [appointments, attendances, session]);

  if (loading) {
    return <LoadingState lines={2} />;
  }

  if (!session) {
    const authRoute = authRouteFrom(route);

    return authRoute === 'cadastro' ? (
      <SignupScreen
        onGoogle={handleGoogleSignIn}
        onEmailSubmit={handleEmailSignup}
        onSwitchMode={() => navigate('entrar')}
        isBusy={authBusy}
      />
    ) : (
      <LoginScreen
        onGoogle={handleGoogleSignIn}
        onEmailSubmit={handleEmailLogin}
        onSwitchMode={() => navigate('cadastro')}
        isBusy={authBusy}
      />
    );
  }

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={(nextRoute) => navigate(nextRoute)}
      session={session}
      notifications={notifications}
    >
      {([
        ['inicio', <HomeScreen key="inicio" />],
        ['clientes', <ClientsScreen key="clientes" />],
        ['agenda', <ScheduleScreen key="agenda" />],
        ['atendimentos', <AttendancesScreen key="atendimentos" />],
        ['mais', <MoreScreen key="mais" onLogout={handleLogout} session={session} />],
      ] as const).map(([appRoute, element]) => {
        const isVisible = activeRoute === appRoute;
        const shouldRender = mountedRoutes[appRoute] || isVisible;

        if (!shouldRender) {
          return null;
        }

        return (
          <section key={appRoute} className="app-route-panel" hidden={!isVisible} aria-hidden={!isVisible}>
            {element}
          </section>
        );
      })}
    </AppShell>
  );
}
