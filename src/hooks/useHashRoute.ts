import { useEffect, useState } from 'react';
import type { Route } from '../types/domain';

const ROUTES: Route[] = ['entrar', 'cadastro', 'inicio', 'clientes', 'agenda', 'atendimentos', 'mais'];

function readRouteFromHash(hash: string): Route {
  const candidate = hash.replace(/^#\/?/, '');

  return ROUTES.includes(candidate as Route) ? (candidate as Route) : 'entrar';
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === 'undefined') {
      return 'entrar';
    }

    return readRouteFromHash(window.location.hash);
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.location.hash) {
      window.location.hash = '#/entrar';
    }

    const handleHashChange = () => {
      setRoute(readRouteFromHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (nextRoute: Route) => {
    if (typeof window === 'undefined') {
      setRoute(nextRoute);
      return;
    }

    window.location.hash = `#/${nextRoute}`;
  };

  return { route, navigate };
}
