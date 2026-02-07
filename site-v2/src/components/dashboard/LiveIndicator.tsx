import { motion } from 'framer-motion';
import { Activity, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  isRefreshing?: boolean;
  lastUpdate?: Date;
}

export function LiveIndicator({ isRefreshing, lastUpdate }: LiveIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
        {isRefreshing ? (
          <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
        ) : (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
        )}
        <span className="text-xs font-medium text-primary">LIVE</span>
        <RefreshCw className={cn(
          "w-3.5 h-3.5 text-primary/70 cursor-pointer hover:text-primary transition-colors",
          isRefreshing && "animate-spin"
        )} />
      </div>
    </motion.div>
  );
}
