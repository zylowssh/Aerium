import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SensorDiscProps {
  isDark?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SensorDisc = forwardRef<HTMLDivElement, SensorDiscProps>(
  ({ isDark = false, className, size = 'lg' }, ref) => {
    const sizeClasses = {
      sm: 'w-[110px] h-[110px]',
      md: 'w-[140px] h-[140px]',
      lg: 'w-[180px] h-[180px]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'sensor-disc will-change-transform',
          sizeClasses[size],
          isDark && 'sensor-disc-dark',
          className
        )}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(isDark ? 'text-white/80' : 'text-[#0B0C10]/80')}
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />
          <circle
            cx="24"
            cy="24"
            r="14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          <circle
            cx="24"
            cy="24"
            r="8"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="24" cy="24" r="3" fill="currentColor" />
          <path
            d="M24 4V12M24 36V44M4 24H12M36 24H44"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
        </svg>
      </div>
    );
  }
);

SensorDisc.displayName = 'SensorDisc';

export default SensorDisc;
