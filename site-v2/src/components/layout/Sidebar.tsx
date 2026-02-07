import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Radio, Bell, FileText, Settings, ChevronLeft, ChevronRight, ShieldCheck, MapPin, Lightbulb, Wrench, GitCompare, Home } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de Bord' },
  { to: '/analytics', icon: BarChart3, label: 'Analyses' },
  { to: '/comparison', icon: GitCompare, label: 'Comparaison' },
  { to: '/sensors', icon: Radio, label: 'Capteurs' },
  { to: '/sensor-map', icon: MapPin, label: 'Carte' },
  { to: '/alerts', icon: Bell, label: 'Alertes Actuelles' },
  { to: '/alert-history', icon: Bell, label: 'Historique des Alertes' },
  { to: '/reports', icon: FileText, label: 'Rapports' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recommandations' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/admin', icon: ShieldCheck, label: 'Admin' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 pl-[0.85rem] py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg overflow-hidden">
          <img src="/logo.png" alt="Aerium Logo" className="w-full h-full object-fill" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold text-foreground">Aerium</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.filter(item => item.to !== '/admin' || isAdmin).map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 m-2 rounded-lg border border-sidebar-border hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
        )}
      </button>
    </aside>
  );
}
