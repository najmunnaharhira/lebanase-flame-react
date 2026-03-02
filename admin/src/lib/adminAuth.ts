const ADMIN_SESSION_KEY = "lf_admin_session_v2";

export interface AdminSessionUser {
  id: number | string;
  name: string;
  email: string;
  role: "admin" | "manager" | "moderator" | "editor" | "user";
  profileImage?: string | null;
}

export interface AdminSession {
  accessToken: string;
  user: AdminSessionUser;
  permissions: string[];
  loggedInAt: number;
}

export const setAdminSession = (session: Omit<AdminSession, "loggedInAt">) => {
  const payload: AdminSession = {
    ...session,
    loggedInAt: Date.now(),
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

export const getAdminSession = (): AdminSession | null => {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.accessToken || !parsed?.user?.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const hasAdminSession = () => {
  return Boolean(getAdminSession()?.accessToken);
};

export const getAdminRole = () => getAdminSession()?.user?.role || null;

export const hasAnyRole = (roles: Array<"admin" | "manager" | "moderator" | "editor" | "user">) => {
  const role = getAdminRole();
  if (!role) return false;
  return roles.includes(role);
};

export const getAdminAuthHeaders = () => {
  const token = getAdminSession()?.accessToken;
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};
