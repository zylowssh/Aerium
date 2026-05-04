import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Info, CheckCircle, Trash2, Check, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, isValid } from 'date-fns';
import { parseBackendDate } from '@/lib/dateTime';

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadCountChange?: (count: number) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  time: string;
  read: boolean;
}

interface RawAlert {
  id?: string | number;
  sensorName?: string;
  type?: string;
  message?: string;
  status?: string;
  timestamp?: string;
}

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

const normalizeNotificationType = (type: string, status: string): Notification['type'] => {
  const normalizedStatus = (status || '').toLowerCase();
  if (normalizedStatus === 'résolue' || normalizedStatus === 'resolved') {
    return 'success';
  }
  const normalizedType = (type || '').toLowerCase();
  if (normalizedType === 'info') {
    return 'info';
  }
  return 'warning';
};

const normalizeStatusToRead = (status: string): boolean => {
  const normalized = (status || '').toLowerCase();
  return normalized === 'reconnue' || normalized === 'acknowledged' || normalized === 'résolue' || normalized === 'resolved';
};

const toRelativeTime = (iso?: string): string => {
  if (!iso) {
    return 'À l\'instant';
  }
  const parsed = parseBackendDate(iso);
  if (!isValid(parsed)) {
    return 'À l\'instant';
  }
  return formatDistanceToNow(parsed, { addSuffix: true });
};

const mapAlertToNotification = (alert: RawAlert): Notification => {
  const sensorName = alert.sensorName || 'Capteur';
  const message = alert.message || 'Alerte sans message';
  return {
    id: String(alert.id ?? ''),
    title: sensorName,
    message,
    type: normalizeNotificationType(alert.type || '', alert.status || ''),
    time: toRelativeTime(alert.timestamp),
    read: normalizeStatusToRead(alert.status || ''),
  };
};

export function NotificationsPanel({ open, onOpenChange, onUnreadCountChange }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const { toast } = useToast();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const loadNotifications = async () => {
    if (!open) {
      return;
    }
    setIsLoading(true);
    try {
      const alerts = await apiClient.getAlerts(undefined, 100);
      const mapped = (alerts || []).map((item: RawAlert) => mapAlertToNotification(item));
      setNotifications(mapped);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadNotifications();
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [open]);

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) {
      return;
    }

    setIsMutating(true);
    try {
      await Promise.all(
        unread.map((notification) => apiClient.updateAlertStatus(notification.id, 'reconnue')),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer toutes les notifications comme lues.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const clearAll = async () => {
    if (notifications.length === 0) {
      return;
    }

    setIsMutating(true);
    try {
      await Promise.all(
        notifications.map((notification) => apiClient.deleteAlert(notification.id)),
      );
      setNotifications([]);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer les notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const markAsRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) {
      return;
    }

    try {
      await apiClient.updateAlertStatus(id, 'reconnue');
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer cette notification comme lue.',
        variant: 'destructive',
      });
    }
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
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-1" disabled={isMutating}>
                <Check className="w-3 h-3" />
                Tout marquer lu
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} className="gap-1" disabled={isMutating}>
                <Trash2 className="w-3 h-3" />
                Effacer tout
              </Button>
              <Button variant="outline" size="sm" onClick={loadNotifications} className="gap-1 ml-auto" disabled={isLoading}>
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {isLoading ? (
              <LoadingSkeleton variant="alerts" count={3} />
            ) : notifications.length === 0 ? (
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
