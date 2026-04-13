const DEFAULT_BACKEND_PORT = '5000';
const FALLBACK_BACKEND_ORIGIN = `http://localhost:${DEFAULT_BACKEND_PORT}`;
const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

const ensureApiSuffix = (value: string): string => {
  const normalized = trimTrailingSlashes(value);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const inferBackendOrigin = (): string => {
  if (typeof window === 'undefined') {
    return FALLBACK_BACKEND_ORIGIN;
  }

  const protocol = window.location.protocol || 'http:';
  const hostname = window.location.hostname || 'localhost';
  return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
};

const safeParseHostname = (value: string): string | null => {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
};

const shouldPreferInferredUrl = (configuredUrl: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const frontendHost = window.location.hostname || 'localhost';
  if (!LOCALHOST_HOSTNAMES.has(frontendHost)) {
    return false;
  }

  const configuredHost = safeParseHostname(configuredUrl);
  if (!configuredHost) {
    return false;
  }

  return !LOCALHOST_HOSTNAMES.has(configuredHost);
};

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const inferredApiUrl = ensureApiSuffix(inferBackendOrigin());
const apiUrlSource = configuredApiUrl && !shouldPreferInferredUrl(configuredApiUrl)
  ? configuredApiUrl
  : inferredApiUrl;

export const API_BASE_URL = ensureApiSuffix(apiUrlSource);
export const SOCKET_BASE_URL = trimTrailingSlashes(API_BASE_URL.replace(/\/api$/, ''));
