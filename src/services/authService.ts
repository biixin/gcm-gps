import type { AuthSession } from '../types';
import { mockUsers } from '../utils/mockData';
import { createDemoJwt } from '../utils/security';

const STORAGE_KEY = 'piar.auth.session';

export async function login(email: string, password: string): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 450));
  const user = mockUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());

  if (!user || password.length < 4) {
    throw new Error('Credenciais invalidas');
  }

  const session: AuthSession = {
    token: createDemoJwt(user.id, user.role),
    user,
    expiresAt: Date.now() + 1000 * 60 * 60 * 8,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt < Date.now()) {
      logout();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
