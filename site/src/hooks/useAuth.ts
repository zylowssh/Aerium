import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

interface User {
  id: number;
  email: string;
  full_name?: string;
  role: 'admin' | 'user';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(authState);

  useEffect(() => {
    const listener = (nextState: AuthState) => {
      setState(nextState);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!initialized) {
      initialized = true;

      if (!token) {
        setAuthState({ user: null, isLoading: false });
        return;
      }

      void fetchCurrentUser();
      return;
    }

    // Handle token changes after first initialization (e.g. after login redirect).
    if (token && !authState.user && !fetchCurrentUserPromise) {
      void fetchCurrentUser();
      return;
    }

    if (!token && authState.user) {
      setAuthState({ user: null, isLoading: false });
    }
  }, []);

  const fetchCurrentUser = async () => {
    if (fetchCurrentUserPromise) {
      return fetchCurrentUserPromise;
    }

    setAuthState({ ...authState, isLoading: true });

    fetchCurrentUserPromise = (async () => {
    try {
      const currentUser = await apiClient.getCurrentUser();
      setAuthState({ user: currentUser, isLoading: false });
    } catch (error) {
      console.error('Error fetching current user:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAuthState({ user: null, isLoading: false });
    } finally {
      fetchCurrentUserPromise = null;
    }
    })();

    return fetchCurrentUserPromise;
  };

  const signOut = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAuthState({ user: null, isLoading: false });
    }
  };

  const isAdmin = state.user?.role === 'admin';
  const userRole = state.user?.role || null;
  const session = state.user ? { user: state.user } : null;

  return {
    user: state.user,
    session,
    isLoading: state.isLoading,
    userRole,
    isAdmin,
    signOut,
    refetch: fetchCurrentUser,
  };
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

let authState: AuthState = {
  user: null,
  isLoading: true,
};

let initialized = false;
let fetchCurrentUserPromise: Promise<void> | null = null;
const listeners = new Set<(state: AuthState) => void>();

const setAuthState = (nextState: AuthState) => {
  authState = nextState;
  listeners.forEach((listener) => listener(authState));
};
