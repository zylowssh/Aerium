import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!isLoading && user && requireAdmin && !isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAdmin, navigate, requireAdmin, user]);

  // Show loading state while checking authentication
  if (isLoading) {
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
  if (user) {
    if (requireAdmin && !isAdmin) {
      return null;
    }
    return <>{children}</>;
  }

  // User is not authenticated, will be redirected
  return null;
}
