import { useState, useEffect, useCallback } from 'react';
import { backendConfig, checkFlaskHealth, isFlaskEnabled, getBackendForFeature, BackendConfig } from '@/lib/backendConfig';
import { apiClient } from '@/lib/apiClient';
 
 export interface BackendStatus {
   flask: {
     enabled: boolean;
     healthy: boolean;
     checking: boolean;
   };
}
 
 /**
 * Hook to manage and monitor Flask backend
  */
 export const useBackend = () => {
   const [status, setStatus] = useState<BackendStatus>({
     flask: {
       enabled: isFlaskEnabled(),
       healthy: false,
       checking: true,
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

  // Check backend on mount
   useEffect(() => {
     checkFlask();
  }, [checkFlask]);

  // Get the appropriate client for a feature
   const getClient = useCallback((feature: keyof BackendConfig['features']) => {
    const backend = getBackendForFeature(feature);
    if (backend === 'flask' && status.flask.healthy) {
      return { type: 'flask' as const, client: apiClient };
    }

    return { type: 'flask' as const, client: apiClient };
  }, [status.flask.healthy]);

  return {
    status,
    checkFlask,
    getClient,
    isFlaskEnabled: isFlaskEnabled(),
    config: backendConfig,
  };
};