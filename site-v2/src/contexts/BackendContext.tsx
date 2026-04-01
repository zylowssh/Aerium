import React, { createContext, useContext, ReactNode } from 'react';
import { useBackend, BackendStatus } from '@/hooks/useBackend';
import { BackendConfig } from '@/lib/backendConfig';
import { apiClient } from '@/lib/apiClient';
 
 interface BackendContextType {
   status: BackendStatus;
   checkFlask: () => Promise<void>;
   getClient: (feature: keyof BackendConfig['features']) => {
   type: 'flask';
   client: typeof apiClient;
   };
   isFlaskEnabled: boolean;
   config: BackendConfig;
 }
 
 const BackendContext = createContext<BackendContextType | undefined>(undefined);
 
 export function BackendProvider({ children }: { children: ReactNode }) {
   const backend = useBackend();
 
   return (
     <BackendContext.Provider value={backend}>
       {children}
     </BackendContext.Provider>
   );
 }
 
 export function useBackendContext() {
   const context = useContext(BackendContext);
   if (context === undefined) {
     throw new Error('useBackendContext must be used within a BackendProvider');
   }
   return context;
 }