export const STUDENT_NPM = "2918";
export const LOGIN_EMAIL = `${STUDENT_NPM}@gmail.com`;
export const LOGIN_PASSWORD = STUDENT_NPM;
export const AUTH_COOKIE_NAME = "guided_auth_status";
export const AUTH_COOKIE_VALUE = "authenticated";

export function createAuthCookie() {
  return `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; Path=/; Max-Age=86400; SameSite=Lax`;
}

export function clearAuthCookie() {
  return `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
