 import { useState, useEffect } from 'react';
 import { Bell, Moon, Sun, User, Download, Plus, SlidersHorizontal, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { ExportDataModal } from '@/components/widgets/ExportDataModal';
import { AddSensorModal } from '@/components/widgets/AddSensorModal';
import { ProfileModal } from '@/components/widgets/ProfileModal';
import { NotificationsPanel } from '@/components/widgets/NotificationsPanel';
import { AlertThresholdsModal } from '@/components/widgets/AlertThresholdsModal';
import { MobileNav } from './MobileNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { useTourContext } from '@/contexts/TourContext';
 import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
 import { cn } from '@/lib/utils';

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export function TopBar({ title = "Dashboard", subtitle }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [exportOpen, setExportOpen] = useState(false);
  const [addSensorOpen, setAddSensorOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [thresholdsOpen, setThresholdsOpen] = useState(false);
   const { startTour, hasCompletedTour } = useTourContext();
 
   // Auto-start tour for first-time users (with a small delay to let page load)
   useEffect(() => {
     if (!hasCompletedTour) {
       const timer = setTimeout(() => {
         startTour();
       }, 1000);
       return () => clearTimeout(timer);
     }
   }, [hasCompletedTour, startTour]);
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // Get the user's first name or a default
  const getUserFirstName = () => {
    if (user?.full_name) {
      return user.full_name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Utilisateur';
  };

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <MobileNav />
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">
              {title === "Dashboard" ? `${getGreeting()}, ${getUserFirstName()}` : title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
            {title === "Dashboard" && (
              <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">Voici votre aperçu de la qualité de l'air</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="outline" size="sm" className="gap-2 hidden md:flex" onClick={() => setExportOpen(true)}>
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Exporter les Données</span>
          </Button>
          
          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={() => setThresholdsOpen(true)}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden lg:inline">Seuils</span>
          </Button>
          
          <Button 
            size="sm" 
            className="gap-2 gradient-primary text-primary-foreground hover:opacity-90 hidden sm:flex" 
            onClick={() => setAddSensorOpen(true)}
            data-tour="add-sensor"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Ajouter un Capteur</span>
          </Button>

          <div className="flex items-center gap-1 ml-1 md:ml-2">
             <Tooltip>
               <TooltipTrigger asChild>
                 <button
                   onClick={startTour}
                   className={cn(
                     "relative p-2 rounded-lg hover:bg-muted transition-colors",
                     !hasCompletedTour && "animate-pulse-ring"
                   )}
                   aria-label="Guide de visite"
                   data-tour="tour-button"
                 >
                   <HelpCircle className={cn(
                     "w-5 h-5",
                     !hasCompletedTour ? "text-primary" : "text-muted-foreground"
                   )} />
                   {!hasCompletedTour && (
                     <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                   )}
                 </button>
               </TooltipTrigger>
               <TooltipContent>
                 <p>Guide de visite</p>
               </TooltipContent>
             </Tooltip>
 
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
               data-tour="theme"
            >
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            <button 
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setNotificationsOpen(true)}
               data-tour="notifications"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>

            <button 
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setProfileOpen(true)}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </header>

      <ExportDataModal open={exportOpen} onOpenChange={setExportOpen} />
      <AddSensorModal open={addSensorOpen} onOpenChange={setAddSensorOpen} />
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
      <NotificationsPanel open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <AlertThresholdsModal open={thresholdsOpen} onOpenChange={setThresholdsOpen} />
    </>
  );
}
