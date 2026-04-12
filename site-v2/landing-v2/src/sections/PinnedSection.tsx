import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PinnedSectionProps {
  children: ReactNode;
  className?: string;
  isDark?: boolean;
  zIndex?: number;
  id?: string;
}

const PinnedSection = forwardRef<HTMLDivElement, PinnedSectionProps>(
  ({ children, className, isDark = false, zIndex = 1, id }, ref) => {
    return (
      <section
        ref={ref}
        id={id}
        className={cn(
          'section-pinned',
          isDark ? 'bg-[#0B0C10]' : 'bg-[#F6F7F9]',
          className
        )}
        style={{ zIndex }}
      >
        {children}
      </section>
    );
  }
);

PinnedSection.displayName = 'PinnedSection';

export default PinnedSection;
