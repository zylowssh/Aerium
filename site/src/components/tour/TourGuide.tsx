 import { useEffect, useState, useCallback } from 'react';
 import { useNavigate, useLocation } from 'react-router-dom';
 import { motion, AnimatePresence } from 'framer-motion';
 import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { TourStep } from '@/hooks/useTour';
 import { cn } from '@/lib/utils';
 
 interface TourGuideProps {
   isOpen: boolean;
   currentStep: number;
   totalSteps: number;
   stepData: TourStep;
   onNext: () => void;
   onPrev: () => void;
   onSkip: () => void;
   onComplete: () => void;
 }
 
 interface Position {
   top: number;
   left: number;
   width: number;
   height: number;
 }
 
 export function TourGuide({
   isOpen,
   currentStep,
   totalSteps,
   stepData,
   onNext,
   onPrev,
   onSkip,
   onComplete
 }: TourGuideProps) {
   const [targetPosition, setTargetPosition] = useState<Position | null>(null);
   const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
   const [isNavigating, setIsNavigating] = useState(false);
   const navigate = useNavigate();
   const location = useLocation();
 
   const updatePosition = useCallback(() => {
     const target = document.querySelector(stepData.target);
     if (target) {
       const rect = target.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(target as Element);
      const marginTop = parseFloat(computedStyle.marginTop || '0') || 0;
      const previousSibling = (target as Element).previousElementSibling as Element | null;
      const previousRect = previousSibling ? previousSibling.getBoundingClientRect() : null;
      const siblingGap = previousRect ? Math.max(0, rect.top - previousRect.bottom) : 0;
      const spacingTop = Math.max(marginTop, siblingGap);
      const adjustedTop = rect.top - spacingTop;
      const adjustedHeight = rect.height + spacingTop;
       const padding = 8;
       
      setTargetPosition({
        top: adjustedTop - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: adjustedHeight + padding * 2
      });
 
       // Calculate tooltip position
       const tooltipWidth = 320;
       const tooltipHeight = 180;
       const margin = 16;
       
       let top = 0;
       let left = 0;
       
       switch (stepData.placement) {
         case 'top':
          top = adjustedTop - tooltipHeight - margin;
           left = rect.left + rect.width / 2 - tooltipWidth / 2;
           break;
         case 'bottom':
          top = adjustedTop + adjustedHeight + margin;
           left = rect.left + rect.width / 2 - tooltipWidth / 2;
           break;
         case 'left':
          top = adjustedTop + adjustedHeight / 2 - tooltipHeight / 2;
           left = rect.left - tooltipWidth - margin;
           break;
         case 'right':
          top = adjustedTop + adjustedHeight / 2 - tooltipHeight / 2;
           left = rect.right + margin;
           break;
         default:
          top = adjustedTop + adjustedHeight + margin;
           left = rect.left + rect.width / 2 - tooltipWidth / 2;
       }
       
       // Keep tooltip in viewport
       left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
       top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));
       
       setTooltipStyle({
         position: 'fixed',
         top: `${top}px`,
         left: `${left}px`,
         width: `${tooltipWidth}px`,
         zIndex: 10001
       });
 
       // Scroll element into view if needed
       target.scrollIntoView({ behavior: 'smooth', block: 'center' });
     } else {
       // If target not found, center the tooltip
       setTargetPosition(null);
       setTooltipStyle({
         position: 'fixed',
         top: '50%',
         left: '50%',
         transform: 'translate(-50%, -50%)',
         width: '320px',
         zIndex: 10001
       });
     }
   }, [stepData]);
 
   useEffect(() => {
     if (isOpen) {
       // Check if we need to navigate to a different page
       if (stepData.page && stepData.page !== location.pathname) {
         setIsNavigating(true);
         navigate(stepData.page);
         // Wait for navigation and then update position
         const timer = setTimeout(() => {
           setIsNavigating(false);
           updatePosition();
         }, 500);
         return () => clearTimeout(timer);
       }
 
       updatePosition();
       window.addEventListener('resize', updatePosition);
       window.addEventListener('scroll', updatePosition, true);
       
       return () => {
         window.removeEventListener('resize', updatePosition);
         window.removeEventListener('scroll', updatePosition, true);
       };
     }
   }, [isOpen, stepData, updatePosition, location.pathname, navigate]);
 
   const isLastStep = currentStep === totalSteps - 1;
   const isFirstStep = currentStep === 0;
 
   // Show loading state while navigating
   if (isNavigating) {
     return (
       <AnimatePresence>
         {isOpen && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center"
           >
             <div className="bg-card p-6 rounded-xl border border-border">
               <div className="flex items-center gap-3">
                 <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                 <p className="text-foreground">Navigation en cours...</p>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     );
   }
 
   return (
     <AnimatePresence>
       {isOpen && (
         <>
           {/* Overlay */}
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[9999]"
             style={{ pointerEvents: 'none' }}
           >
             <svg className="w-full h-full" style={{ pointerEvents: 'auto' }}>
               <defs>
                 <mask id="tour-mask">
                   <rect x="0" y="0" width="100%" height="100%" fill="white" />
                   {targetPosition && (
                     <rect
                       x={targetPosition.left}
                       y={targetPosition.top}
                       width={targetPosition.width}
                       height={targetPosition.height}
                       rx="8"
                       fill="black"
                     />
                   )}
                 </mask>
               </defs>
               <rect
                 x="0"
                 y="0"
                 width="100%"
                 height="100%"
                 fill="rgba(0,0,0,0.75)"
                 mask="url(#tour-mask)"
               />
             </svg>
           </motion.div>
 
           {/* Highlight Border */}
           {targetPosition && (
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ duration: 0.2 }}
               className="fixed z-[10000] rounded-lg border-2 border-primary shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.2)]"
               style={{
                 top: targetPosition.top,
                 left: targetPosition.left,
                 width: targetPosition.width,
                 height: targetPosition.height,
                 pointerEvents: 'none'
               }}
             />
           )}
 
           {/* Tooltip */}
           <motion.div
             key={currentStep}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.2 }}
             style={tooltipStyle}
             className="bg-card border border-border rounded-xl shadow-2xl p-4"
           >
             {/* Header */}
             <div className="flex items-start justify-between mb-3">
               <div className="flex items-center gap-2">
                 <div className="p-1.5 rounded-lg bg-primary/10">
                   <HelpCircle className="w-4 h-4 text-primary" />
                 </div>
                 <h3 className="font-semibold text-foreground text-sm">{stepData.title}</h3>
               </div>
               <button
                 onClick={onSkip}
                 className="p-1 rounded-md hover:bg-muted transition-colors"
               >
                 <X className="w-4 h-4 text-muted-foreground" />
               </button>
             </div>
 
             {/* Content */}
             <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
               {stepData.content}
             </p>
 
             {/* Progress */}
             <div className="flex items-center gap-1 mb-4">
               {Array.from({ length: totalSteps }).map((_, i) => (
                 <div
                   key={i}
                   className={cn(
                     "h-1.5 rounded-full transition-all duration-300",
                     i === currentStep
                       ? "w-6 bg-primary"
                       : i < currentStep
                       ? "w-3 bg-primary/50"
                       : "w-3 bg-muted"
                   )}
                 />
               ))}
             </div>
 
             {/* Actions */}
             <div className="flex items-center justify-between">
               <span className="text-xs text-muted-foreground">
                 {currentStep + 1} / {totalSteps}
               </span>
               <div className="flex items-center gap-2">
                 {!isFirstStep && (
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={onPrev}
                     className="gap-1"
                   >
                     <ChevronLeft className="w-4 h-4" />
                     Précédent
                   </Button>
                 )}
                 <Button
                   size="sm"
                   onClick={isLastStep ? onComplete : onNext}
                   className="gap-1"
                 >
                   {isLastStep ? 'Terminer' : 'Suivant'}
                   {!isLastStep && <ChevronRight className="w-4 h-4" />}
                 </Button>
               </div>
             </div>
           </motion.div>
         </>
       )}
     </AnimatePresence>
   );
 }