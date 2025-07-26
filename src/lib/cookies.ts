// Cookie utility functions for token management

export const COOKIE_NAME = 'token';
export const COOKIE_OPTIONS = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Set a cookie with the given name, value, and options
 */
export function setCookie(name: string, value: string, options: Partial<typeof COOKIE_OPTIONS> = {}) {
  if (typeof window === 'undefined') return;

  const cookieOptions = { ...COOKIE_OPTIONS, ...options };
  let cookieString = `${name}=${encodeURIComponent(value)}`;

  if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
  if (cookieOptions.maxAge) cookieString += `; max-age=${cookieOptions.maxAge}`;
  if (cookieOptions.secure) cookieString += '; secure';
  if (cookieOptions.sameSite) cookieString += `; samesite=${cookieOptions.sameSite}`;

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, options: Partial<typeof COOKIE_OPTIONS> = {}) {
  if (typeof window === 'undefined') return;

  const cookieOptions = { ...COOKIE_OPTIONS, ...options };
  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
  if (cookieOptions.secure) cookieString += '; secure';
  if (cookieOptions.sameSite) cookieString += `; samesite=${cookieOptions.sameSite}`;

  document.cookie = cookieString;
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Get the authentication token from cookies
 */
export function getAuthToken(): string | null {
  return getCookie(COOKIE_NAME);
}

/**
 * Set the authentication token in cookies
 */
export function setAuthToken(token: string): void {
  setCookie(COOKIE_NAME, token);
}

/**
 * Remove the authentication token from cookies
 */
export function removeAuthToken(): void {
  deleteCookie(COOKIE_NAME);
} 