export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'user';
  created_at?: string;
}

const USER_SESSION_KEY = 'grisella_user_session';

export function getUserSession(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUserSession(user: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('grisella-user-auth-change', { detail: user }));
  } catch (err) {
    console.error('Failed to save user session:', err);
  }
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_SESSION_KEY);
    window.dispatchEvent(new CustomEvent('grisella-user-auth-change', { detail: null }));
  } catch (err) {
    console.error('Failed to clear user session:', err);
  }
}
