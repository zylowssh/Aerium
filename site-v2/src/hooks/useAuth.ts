import { useState, useEffect } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  };

  const isAdmin = user?.role === 'admin';
  const userRole = user?.role || null;
  const session = user ? { user } : null;

  return {
    user,
    session,
    isLoading,
    userRole,
    isAdmin,
    signOut,
    refetch: fetchCurrentUser,
  };
};
