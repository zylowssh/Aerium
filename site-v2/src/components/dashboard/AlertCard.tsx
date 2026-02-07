import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Alert } from '@/lib/sensorData';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { memo } from 'react';

export interface AlertCardProps {
  alert: Alert;
}

export const AlertCard = memo(function AlertCard({ alert }: AlertCardProps) {
  const typeStyles = {
    avertissement: {
      bg: 'bg-warning/10',
      border: 'border-warning/30 hover:border-warning/50',
      icon: 'text-warning',
      badge: 'bg-warning/20 text-warning border border-warning/30'
    },
    critique: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/30 hover:border-destructive/50',
      icon: 'text-destructive',
      badge: 'bg-destructive/20 text-destructive border border-destructive/30'
    },
    info: {
      bg: 'bg-primary/10',
      border: 'border-primary/30 hover:border-primary/50',
      icon: 'text-primary',
      badge: 'bg-primary/20 text-primary border border-primary/30'
    }
  };

  const style = typeStyles[alert.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "p-4 rounded-xl border transition-all duration-300",
        style.bg,
        style.border
      )}
    >
      <div className="flex items-start gap-3">
        <motion.div 
          className={cn("p-2.5 rounded-xl", style.bg)}
          whileHover={{ scale: 1.1 }}
        >
          <AlertTriangle className={cn("w-4 h-4", style.icon)} />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground truncate">{alert.sensorName}</h4>
            <span className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1",
              alert.status === 'nouvelle' ? style.badge : "bg-muted text-muted-foreground border border-border"
            )}>
              {alert.status === 'nouvelle' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Nouveau
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Reconnue
                </>
              )}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1.5">
            {alert.message}: <span className="font-bold text-foreground">{alert.value}ppm</span>
          </p>
          
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(alert.timestamp, { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
