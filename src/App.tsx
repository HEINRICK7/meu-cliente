import { useEffect, useState } from 'react';
import { Toast } from 'antd-mobile';
import { AppShell } from './components/AppShell';
import { LoadingState } from './components/LoadingState';
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
import type { AuthFormValues } from './features/auth/AuthScreen';
import type { AppRoute, AuthRoute, Route } from './types/domain';

function isAppRoute(route: Route): route is AppRoute {
  return route === 'inicio' || route === 'clientes' || route === 'agenda' || route === 'atendimentos' || route === 'mais';
}

function authRouteFrom(route: Route): AuthRoute {
  return route === 'cadastro' ? 'cadastro' : 'entrar';
}

export default function App() {
  const { route, navigate } = useHashRoute();
  const { session, loading } = useAuth();
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
    <AppShell activeRoute={activeRoute} onNavigate={(nextRoute) => navigate(nextRoute)} session={session}>
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
