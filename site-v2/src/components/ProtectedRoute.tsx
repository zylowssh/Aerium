import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has access token
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      // No token found, redirect to auth
      navigate('/auth', { replace: true });
      setIsAuthenticated(false);
    } else {
      // Token exists, user is authenticated
      setIsAuthenticated(true);
    }
  }, [navigate]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </motion.div>
    );
  }

  // User is authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // User is not authenticated, will be redirected
  return null;
}
