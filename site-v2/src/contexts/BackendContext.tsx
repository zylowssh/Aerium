 import React, { createContext, useContext, ReactNode } from 'react';
 import { useBackend, BackendStatus } from '@/hooks/useBackend';
 import { BackendConfig, backendConfig } from '@/lib/backendConfig';
 import { apiClient } from '@/lib/apiClient';
 import { supabase } from '@/integrations/supabase/client';
 
 // Handle optional supabase (only available if env vars are set)
 const supabaseClient = supabase || undefined;
 
 interface BackendContextType {
   status: BackendStatus;
   checkFlask: () => Promise<void>;
   checkSupabase: () => Promise<void>;
   getClient: (feature: keyof BackendConfig['features']) => {
     type: 'flask' | 'supabase';
     client: typeof apiClient | typeof supabase | undefined;
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