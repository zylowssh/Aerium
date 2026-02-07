import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Radio, 
  Bell, 
  FileText, 
  Settings, 
  ShieldCheck, 
  MapPin, 
  Lightbulb, 
  Wrench,
  Menu,
  X,
  GitCompare,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de Bord' },
  { to: '/analytics', icon: BarChart3, label: 'Analyses' },
  { to: '/comparison', icon: GitCompare, label: 'Comparaison' },
  { to: '/sensors', icon: Radio, label: 'Capteurs' },
  { to: '/sensor-map', icon: MapPin, label: 'Carte' },
  { to: '/alerts', icon: Bell, label: 'Alertes' },
  { to: '/reports', icon: FileText, label: 'Rapports' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recommandations' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/admin', icon: ShieldCheck, label: 'Admin' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <img src="/logo.png" alt="Aerium" className="w-full h-full object-fill" />
            </div>
            <span className="text-lg font-semibold">Aerium</span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.filter(item => item.to !== '/admin' || isAdmin).map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                  "hover:bg-muted",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
