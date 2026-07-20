const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_ROLE_KEY = 'auth_role';
const AUTH_USER_KEY = 'auth_user';
const COOKIE_PATH = '/';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${COOKIE_PATH}; max-age=${maxAge}; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=${COOKIE_PATH}; max-age=0; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const authCookies = {
  setToken(token: string) {
    setCookie(AUTH_TOKEN_KEY, token);
  },

  getToken(): string | null {
    return getCookie(AUTH_TOKEN_KEY);
  },

  clearToken() {
    removeCookie(AUTH_TOKEN_KEY);
  },

  setRole(role: string) {
    setCookie(AUTH_ROLE_KEY, role);
  },

  getRole(): string | null {
    return getCookie(AUTH_ROLE_KEY);
  },

  clearRole() {
    removeCookie(AUTH_ROLE_KEY);
  },

  setUser(user: { id: string; name: string; role: string; company_id?: string }) {
    setCookie(AUTH_USER_KEY, JSON.stringify({ id: user.id, name: user.name, role: user.role, company_id: user.company_id }));
  },

  clearUser() {
    removeCookie(AUTH_USER_KEY);
  },

  clearAll() {
    removeCookie(AUTH_TOKEN_KEY);
    removeCookie(AUTH_ROLE_KEY);
    removeCookie(AUTH_USER_KEY);
  },
};
