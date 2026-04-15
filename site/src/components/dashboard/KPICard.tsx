import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface KPICardProps {
  label: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  status?: 'default' | 'success' | 'warning' | 'danger';
}

export function KPICard({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  trend, 
  trendLabel,
  status = 'default' 
}: KPICardProps) {
  const statusColors = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive'
  };

  const iconBgColors = {
    default: 'bg-primary/10',
    success: 'bg-success/10',
    warning: 'bg-warning/10',
    danger: 'bg-destructive/10'
  };

  const glowColors = {
    default: 'group-hover:shadow-primary/10',
    success: 'group-hover:shadow-success/10',
    warning: 'group-hover:shadow-warning/10',
    danger: 'group-hover:shadow-destructive/10'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 p-4 md:p-5",
        "bg-card/70 backdrop-blur-sm supports-[backdrop-filter]:bg-card/55",
        "hover:border-primary/40 transition-all duration-300",
        "hover:shadow-lg",
        glowColors[status]
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />

      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <motion.div 
          className={cn("rounded-xl border border-border/50 p-2.5", iconBgColors[status])}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className={cn("w-4 h-4", statusColors[status])} />
        </motion.div>
      </div>
      
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-3xl font-bold", statusColors[status])}>{value}</span>
        {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
      </div>
      
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-3">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            trend >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
            <span className="text-xs text-muted-foreground">{trendLabel || 'vs hier'}</span>
        </div>
      )}
    </motion.div>
  );
}
