import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { useHashRoute } from './hooks/useHashRoute';
import type { AuthValues } from './features/auth/AuthScreen';
import { LoginScreen } from './features/auth/LoginScreen';
import { SignupScreen } from './features/auth/SignupScreen';
import { HomeScreen } from './features/home/HomeScreen';
import { ClientsScreen } from './features/clients/ClientsScreen';
import { ScheduleScreen } from './features/schedule/ScheduleScreen';
import { AttendancesScreen } from './features/attendances/AttendancesScreen';
import { MoreScreen } from './features/more/MoreScreen';
import {
  clearAuthSession,
  readAuthSession,
  signInWithEmail,
  signInWithSocial,
  signUpWithEmail,
} from './services/mockAuth';
import type { AppRoute, AuthRoute, Route, SocialProvider } from './types/domain';

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
  const [session, setSession] = useState(() => readAuthSession());

  useEffect(() => {
    if (session && !isAppRoute(route)) {
      navigate('inicio');
      return;
    }

    if (!session && isAppRoute(route)) {
      navigate('entrar');
    }
  }, [navigate, route, session]);

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
    navigate('entrar');
  };

  const handleSignIn = (values: AuthValues) => {
    const nextSession = signInWithEmail(values);
    setSession(nextSession);
    navigate('inicio');
  };

  const handleSignUp = (values: AuthValues) => {
    const nextSession = signUpWithEmail(values);
    setSession(nextSession);
    navigate('inicio');
  };

  const handleSocial = (provider: SocialProvider) => {
    const nextSession = signInWithSocial(provider);
    setSession(nextSession);
    navigate('inicio');
  };

  if (!session) {
    const authRoute = authRouteFrom(route);

    return authRoute === 'cadastro' ? (
      <SignupScreen
        onSubmit={handleSignUp}
        onSocial={handleSocial}
        onSwitchMode={() => navigate('entrar')}
      />
    ) : (
      <LoginScreen
        onSubmit={handleSignIn}
        onSocial={handleSocial}
        onSwitchMode={() => navigate('cadastro')}
      />
    );
  }

  const activeRoute = isAppRoute(route) ? route : 'inicio';

  return (
    <AppShell activeRoute={activeRoute} onNavigate={(nextRoute) => navigate(nextRoute)}>
      {screens[activeRoute](handleLogout)}
    </AppShell>
  );
}
