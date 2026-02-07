import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Info, CheckCircle, Trash2, Check } from 'lucide-react';
import { useState } from 'react';

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'CO₂ Élevé Détecté',
    message: 'Le capteur Bureau A a détecté un niveau de CO₂ de 1200 ppm.',
    type: 'warning',
    time: 'Il y a 5 min',
    read: false,
  },
  {
    id: '2',
    title: 'Capteur Reconnecté',
    message: 'Le capteur Salle de Réunion B est de nouveau en ligne.',
    type: 'success',
    time: 'Il y a 15 min',
    read: false,
  },
  {
    id: '3',
    title: 'Rapport Hebdomadaire',
    message: 'Votre rapport de qualité de l\'air est disponible.',
    type: 'info',
    time: 'Il y a 1 heure',
    read: true,
  },
  {
    id: '4',
    title: 'Maintenance Planifiée',
    message: 'Une maintenance système est prévue pour demain à 3h00.',
    type: 'info',
    time: 'Il y a 2 heures',
    read: true,
  },
];

const typeIcons = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const typeColors = {
  warning: 'text-amber-500',
  info: 'text-blue-500',
  success: 'text-emerald-500',
};

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Vos alertes et mises à jour récentes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {notifications.length > 0 && (
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-1">
                <Check className="w-3 h-3" />
                Tout marquer lu
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} className="gap-1">
                <Trash2 className="w-3 h-3" />
                Effacer tout
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      !notification.read ? 'bg-muted/30 border-primary/20' : 'border-border'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${typeColors[notification.type]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
