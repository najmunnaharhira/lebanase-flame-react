const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "Admin@123";
const ADMIN_SESSION_KEY = "lf_admin_session";

export const isAdminCredentials = (email: string, password: string) => {
  return email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
};

export const setAdminSession = (email: string) => {
  const payload = {
    email,
    loggedInAt: Date.now(),
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

export const hasAdminSession = () => {
  return Boolean(localStorage.getItem(ADMIN_SESSION_KEY));
};

export const getAdminAuthHeaders = () => ({
  "x-admin-email": ADMIN_EMAIL,
  "x-admin-password": ADMIN_PASSWORD,
});
