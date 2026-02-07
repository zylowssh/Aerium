 /**
  * Backend Configuration for Aerium
  * 
  * This app supports TWO backends:
  * 1. Flask Backend (Python) - Original backend for sensor simulation and advanced features
  * 2. Lovable Cloud (Supabase) - For authentication, real-time updates, and cloud storage
  * 
  * The backends work together:
  * - Flask: Sensor data simulation, email alerts, advanced analytics
  * - Lovable Cloud: User auth, profiles, real-time subscriptions, file storage
  */
 
 export type BackendType = 'flask' | 'supabase' | 'both';
 
 export interface BackendConfig {
   // Flask Backend Configuration
   flask: {
     enabled: boolean;
     baseUrl: string;
     healthEndpoint: string;
   };
   // Lovable Cloud (Supabase) Configuration
   supabase: {
     enabled: boolean;
     // Supabase is auto-configured via environment variables
   };
   // Which backend to use for each feature
   features: {
     auth: 'flask' | 'supabase';
     sensors: 'flask' | 'supabase';
     alerts: 'flask' | 'supabase';
     readings: 'flask' | 'supabase';
     users: 'flask' | 'supabase';
     realtime: 'supabase'; // Realtime is always Supabase
     storage: 'supabase'; // File storage is always Supabase
   };
 }
 
 // Default configuration - can be overridden via environment variables
 export const backendConfig: BackendConfig = {
   flask: {
     enabled: import.meta.env.VITE_FLASK_ENABLED === 'true',
     baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
     healthEndpoint: '/health',
   },
   supabase: {
     enabled: true, // Always enabled when connected to Lovable Cloud
   },
   features: {
     // Default: Use Flask for auth (local development)
     auth: 'flask',
     // Sensors can use either backend
     sensors: import.meta.env.VITE_FLASK_ENABLED === 'true' ? 'flask' : 'supabase',
     // Alerts from Flask (for email notifications)
     alerts: import.meta.env.VITE_FLASK_ENABLED === 'true' ? 'flask' : 'supabase',
     // Readings from Flask (for simulation) or Supabase (for storage)
     readings: import.meta.env.VITE_FLASK_ENABLED === 'true' ? 'flask' : 'supabase',
     // User profiles in Supabase
     users: 'supabase',
     // Realtime always Supabase
     realtime: 'supabase',
     // Storage always Supabase
     storage: 'supabase',
   },
 };
 
 /**
  * Check if Flask backend is available
  */
 export const isFlaskEnabled = (): boolean => {
   return backendConfig.flask.enabled;
 };
 
 /**
  * Check if Supabase is enabled
  */
 export const isSupabaseEnabled = (): boolean => {
   return backendConfig.supabase.enabled;
 };
 
 /**
  * Get the backend to use for a specific feature
  */
 export const getBackendForFeature = (feature: keyof BackendConfig['features']): 'flask' | 'supabase' => {
   return backendConfig.features[feature];
 };
 
 /**
  * Check Flask backend health
  */
 export const checkFlaskHealth = async (): Promise<boolean> => {
   if (!backendConfig.flask.enabled) return false;
   
   try {
     const response = await fetch(`${backendConfig.flask.baseUrl}${backendConfig.flask.healthEndpoint}`);
     return response.ok;
   } catch {
     return false;
   }
 };