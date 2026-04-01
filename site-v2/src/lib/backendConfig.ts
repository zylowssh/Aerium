/**
 * Backend Configuration for Aerium (Flask-only).
 */

import { API_BASE_URL } from '@/lib/apiBaseUrl';

export type BackendType = 'flask';

export interface BackendConfig {
  flask: {
    enabled: boolean;
    baseUrl: string;
    healthEndpoint: string;
  };
  features: {
    auth: 'flask';
    sensors: 'flask';
    alerts: 'flask';
    readings: 'flask';
    users: 'flask';
    realtime: 'flask';
    storage: 'flask';
  };
}

export const backendConfig: BackendConfig = {
  flask: {
    enabled: import.meta.env.VITE_FLASK_ENABLED === 'true',
    baseUrl: API_BASE_URL,
    healthEndpoint: '/health',
  },
  features: {
    auth: 'flask',
    sensors: 'flask',
    alerts: 'flask',
    readings: 'flask',
    users: 'flask',
    realtime: 'flask',
    storage: 'flask',
  },
};

export const isFlaskEnabled = (): boolean => {
  return backendConfig.flask.enabled;
};

export const getBackendForFeature = (_feature: keyof BackendConfig['features']): 'flask' => {
  return 'flask';
};

export const checkFlaskHealth = async (): Promise<boolean> => {
  if (!backendConfig.flask.enabled) return false;

  try {
    const response = await fetch(`${backendConfig.flask.baseUrl}${backendConfig.flask.healthEndpoint}`);
    return response.ok;
  } catch {
    return false;
  }
};