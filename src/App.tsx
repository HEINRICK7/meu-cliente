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
import { getAuthErrorMessage, signInWithGoogle, signOut } from './services/authService';
import type { AppRoute, AuthRoute, Route } from './types/domain';

const screens: Record<AppRoute, (onLogout: () => void) => JSX.Element> = {
  inicio: () => <HomeScreen />,
  clientes: () => <ClientsScreen />,
  agenda: () => <ScheduleScreen />,
  atendimentos: () => <AttendancesScreen />,
  mais: (onLogout) => <MoreScreen onLogout={onLogout} />,
};

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

  if (loading) {
    return <LoadingState lines={2} />;
  }

  if (!session) {
    const authRoute = authRouteFrom(route);

    return authRoute === 'cadastro' ? (
      <SignupScreen onGoogle={handleGoogleSignIn} onSwitchMode={() => navigate('entrar')} isBusy={authBusy} />
    ) : (
      <LoginScreen onGoogle={handleGoogleSignIn} onSwitchMode={() => navigate('cadastro')} isBusy={authBusy} />
    );
  }

  const activeRoute = isAppRoute(route) ? route : 'inicio';

  return (
    <AppShell activeRoute={activeRoute} onNavigate={(nextRoute) => navigate(nextRoute)}>
      {activeRoute === 'mais' ? <MoreScreen onLogout={handleLogout} session={session} /> : screens[activeRoute](handleLogout)}
    </AppShell>
  );
}
