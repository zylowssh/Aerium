import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, LayoutDashboard, CloudOff } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="max-w-xl w-full border-border/50 shadow-xl">
        <CardContent className="p-8 text-center">
          {/* Animated Icon */}
          <div className="relative mx-auto mb-6 w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-25" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <CloudOff className="h-12 w-12 text-primary" />
            </div>
          </div>

          {/* 404 Number */}
          <h1 className="text-7xl font-bold text-gradient-primary mb-4">404</h1>

          {/* Title */}
          <h2 className="text-2xl font-semibold mb-2">Page Introuvable</h2>
          
          {/* Subtitle */}
          <p className="text-muted-foreground mb-4">Oups ! Cette page semble s'être envolée</p>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            La page que vous cherchez n'existe pas ou a été déplacée. Vérifiez l'URL ou retournez à l'accueil.
          </p>

          {/* Fun message */}
          <div className="flex items-center justify-center gap-2 mb-8 p-3 rounded-lg bg-muted/50 text-sm">
            <CloudOff className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-muted-foreground italic">Peut-être que la qualité de l'air est si bonne que même les pages disparaissent ! 🌬️</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => window.history.back()} size="lg">
              <Home className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Aller au Tableau de Bord
              </Link>
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border">
            <Link to="/" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="Aerium Logo" className="w-full h-full object-fill" />
              </div>
              <span className="font-semibold">Aerium</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
