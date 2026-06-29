import type { AuthSession, SocialProvider } from '../types/domain';

const AUTH_SESSION_KEY = 'meu-cliente-auth-session';

export interface EmailAuthInput {
  name?: string;
  email: string;
  password: string;
}

function getStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.localStorage;
}

function buildSession(name: string, email: string, provider: AuthSession['provider']): AuthSession {
  const now = new Date().toISOString();

  return {
    id: `session-${email.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'user'}`,
    name,
    email,
    provider,
    createdAt: now,
  };
}

export function readAuthSession(): AuthSession | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const raw = storage.getItem(AUTH_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    storage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function clearAuthSession() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_SESSION_KEY);
}

function saveAuthSession(session: AuthSession) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function signInWithEmail(input: EmailAuthInput): AuthSession {
  const session = buildSession(input.name?.trim() || input.email.split('@')[0] || 'Usuário', input.email.trim(), 'email');

  saveAuthSession(session);

  return session;
}

export function signUpWithEmail(input: EmailAuthInput): AuthSession {
  const session = buildSession(input.name?.trim() || 'Novo usuário', input.email.trim(), 'email');

  saveAuthSession(session);

  return session;
}

export function signInWithSocial(provider: SocialProvider): AuthSession {
  const socialNames: Record<SocialProvider, string> = {
    google: 'Conta Google',
    apple: 'Conta Apple',
    facebook: 'Conta Facebook',
  };

  const session = buildSession(socialNames[provider], `${provider}@demo.meucliente.app`, provider);
  saveAuthSession(session);

  return session;
}
