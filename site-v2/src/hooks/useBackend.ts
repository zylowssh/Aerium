 import { useState, useEffect, useCallback } from 'react';
 import { backendConfig, checkFlaskHealth, isFlaskEnabled, getBackendForFeature, BackendConfig } from '@/lib/backendConfig';
 import { apiClient } from '@/lib/apiClient';
 import { supabase } from '@/integrations/supabase/client';
 
 // Handle optional supabase (only available if env vars are set)
 const supabaseAvailable = supabase !== null;
 
 export interface BackendStatus {
   flask: {
     enabled: boolean;
     healthy: boolean;
     checking: boolean;
   };
   supabase: {
     enabled: boolean;
     healthy: boolean;
     checking: boolean;
   };
 }
 
 /**
  * Hook to manage and monitor both backends
  */
 export const useBackend = () => {
   const [status, setStatus] = useState<BackendStatus>({
     flask: {
       enabled: isFlaskEnabled(),
       healthy: false,
       checking: true,
     },
     supabase: {
       enabled: supabaseAvailable,
       healthy: false,
       checking: supabaseAvailable,
     },
   });
 
   // Check Flask backend health
   const checkFlask = useCallback(async () => {
     if (!isFlaskEnabled()) {
       setStatus(prev => ({
         ...prev,
         flask: { ...prev.flask, checking: false, healthy: false },
       }));
       return;
     }
 
     setStatus(prev => ({
       ...prev,
       flask: { ...prev.flask, checking: true },
     }));
 
     const healthy = await checkFlaskHealth();
     setStatus(prev => ({
       ...prev,
       flask: { ...prev.flask, checking: false, healthy },
     }));
   }, []);
 
   // Check Supabase health
   const checkSupabase = useCallback(async () => {
     if (!supabaseAvailable) {
       setStatus(prev => ({
         ...prev,
         supabase: { ...prev.supabase, checking: false, healthy: false },
       }));
       return;
     }

     setStatus(prev => ({
       ...prev,
       supabase: { ...prev.supabase, checking: true },
     }));

     try {
       const { error } = await supabase!.from('profiles').select('id').limit(1);
       setStatus(prev => ({
         ...prev,
         supabase: { ...prev.supabase, checking: false, healthy: !error },
       }));
     } catch {
       setStatus(prev => ({
         ...prev,
         supabase: { ...prev.supabase, checking: false, healthy: false },
       }));
     }
   }, []);
 
   // Check both backends on mount
   useEffect(() => {
     checkFlask();
     checkSupabase();
   }, [checkFlask, checkSupabase]);
 
   // Get the appropriate client for a feature
   const getClient = useCallback((feature: keyof BackendConfig['features']) => {
     const backend = getBackendForFeature(feature);
     
     if (backend === 'flask' && status.flask.healthy) {
       return { type: 'flask' as const, client: apiClient };
     }
     
     // Fallback to Supabase if Flask is not healthy and supabase is available
     if (supabaseAvailable && status.supabase.healthy) {
       return { type: 'supabase' as const, client: supabase };
     }
     
     // Default to Flask client if nothing else works
     return { type: 'flask' as const, client: apiClient };
   }, [status.flask.healthy, status.supabase.healthy]);
 
   return {
     status,
     checkFlask,
     checkSupabase,
     getClient,
     isFlaskEnabled: isFlaskEnabled(),
     config: backendConfig,
   };
 };