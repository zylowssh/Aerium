import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, Bot, Keyboard } from 'lucide-react';
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

type PanelPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'mobile';

const MOBILE_BREAKPOINT = 768;
const PANEL_WIDTH = 360;
const PANEL_HEIGHT_ESTIMATE = 308;
const PANEL_MARGIN = 16;
const HIGHLIGHT_PADDING = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getPageLabel = (page?: string) => {
  if (!page) return 'Parcours';
  if (page === '/dashboard') return 'Tableau de bord';
  if (page === '/analytics') return 'Analyses';
  if (page === '/sensors') return 'Capteurs';
  return 'Parcours';
};

export function TourGuide({
  isOpen,
  currentStep,
  totalSteps,
  stepData,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: TourGuideProps) {
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const [panelPlacement, setPanelPlacement] = useState<PanelPlacement>('center');
  const [isNavigating, setIsNavigating] = useState(false);

  const retryTimeoutRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const centerPanel = useCallback(() => {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const panelWidth = Math.min(PANEL_WIDTH, window.innerWidth - 24);

    setTargetPosition(null);

    if (isMobile) {
      setPanelPlacement('mobile');
      setPanelStyle({
        position: 'fixed',
        left: '12px',
        right: '12px',
        bottom: '12px',
        width: 'auto',
        zIndex: 10001,
      });
      return;
    }

    setPanelPlacement('center');
    setPanelStyle({
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${panelWidth}px`,
      zIndex: 10001,
    });
  }, []);

  const positionPanel = useCallback(() => {
    const target = document.querySelector(stepData.target) as HTMLElement | null;
    if (!target) {
      return false;
    }

    const rect = target.getBoundingClientRect();
    const highlight: Position = {
      top: rect.top - HIGHLIGHT_PADDING,
      left: rect.left - HIGHLIGHT_PADDING,
      width: rect.width + HIGHLIGHT_PADDING * 2,
      height: rect.height + HIGHLIGHT_PADDING * 2,
    };

    setTargetPosition(highlight);

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const panelWidth = Math.min(PANEL_WIDTH, window.innerWidth - 24);

    if (isMobile) {
      setPanelPlacement('mobile');
      setPanelStyle({
        position: 'fixed',
        left: '12px',
        right: '12px',
        bottom: '12px',
        width: 'auto',
        zIndex: 10001,
      });
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      return true;
    }

    const desiredPlacement = stepData.placement || 'bottom';

    let top = rect.bottom + PANEL_MARGIN;
    let left = rect.left + rect.width / 2 - panelWidth / 2;

    if (desiredPlacement === 'top') {
      top = rect.top - PANEL_HEIGHT_ESTIMATE - PANEL_MARGIN;
    }

    if (desiredPlacement === 'left') {
      top = rect.top + rect.height / 2 - PANEL_HEIGHT_ESTIMATE / 2;
      left = rect.left - panelWidth - PANEL_MARGIN;
    }

    if (desiredPlacement === 'right') {
      top = rect.top + rect.height / 2 - PANEL_HEIGHT_ESTIMATE / 2;
      left = rect.right + PANEL_MARGIN;
    }

    const maxLeft = Math.max(PANEL_MARGIN, window.innerWidth - panelWidth - PANEL_MARGIN);
    const maxTop = Math.max(PANEL_MARGIN, window.innerHeight - PANEL_HEIGHT_ESTIMATE - PANEL_MARGIN);

    setPanelPlacement(desiredPlacement);
    setPanelStyle({
      position: 'fixed',
      top: `${clamp(top, PANEL_MARGIN, maxTop)}px`,
      left: `${clamp(left, PANEL_MARGIN, maxLeft)}px`,
      width: `${panelWidth}px`,
      zIndex: 10001,
    });

    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    return true;
  }, [stepData.placement, stepData.target]);

  const initializeStepPosition = useCallback(() => {
    let attempt = 0;

    const attemptPosition = () => {
      const found = positionPanel();
      if (found) {
        return;
      }

      attempt += 1;
      if (attempt >= 18) {
        centerPanel();
        return;
      }

      retryTimeoutRef.current = window.setTimeout(attemptPosition, 120);
    };

    clearRetryTimeout();
    attemptPosition();
  }, [centerPanel, clearRetryTimeout, positionPanel]);

  useEffect(() => {
    if (!isOpen) {
      clearRetryTimeout();
      return;
    }

    if (stepData.page && stepData.page !== location.pathname) {
      setIsNavigating(true);
      navigate(stepData.page);

      const timer = window.setTimeout(() => {
        setIsNavigating(false);
        initializeStepPosition();
      }, 420);

      return () => {
        window.clearTimeout(timer);
        clearRetryTimeout();
      };
    }

    initializeStepPosition();

    const handleViewportChange = () => {
      const found = positionPanel();
      if (!found) {
        initializeStepPosition();
      }
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      clearRetryTimeout();
    };
  }, [
    clearRetryTimeout,
    initializeStepPosition,
    isOpen,
    location.pathname,
    navigate,
    positionPanel,
    stepData.page,
  ]);

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const pageLabel = stepData.section || getPageLabel(stepData.page);
  const mascotTip =
    stepData.mascotTip ||
    "Astuce: votre mascotte pourra personnaliser cette explication pour chaque étape.";
  const progressPercent = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const pointerStyle = (() => {
    if (!targetPosition || panelPlacement === 'center' || panelPlacement === 'mobile') {
      return null;
    }

    const panelLeft = toNumber(panelStyle.left);
    const panelTop = toNumber(panelStyle.top);
    const panelWidth = toNumber(panelStyle.width) || PANEL_WIDTH;
    const targetCenterX = targetPosition.left + targetPosition.width / 2;
    const targetCenterY = targetPosition.top + targetPosition.height / 2;

    const pointerX = clamp(targetCenterX - panelLeft - 7, 26, panelWidth - 26);
    const pointerY = clamp(targetCenterY - panelTop - 7, 34, 260);

    const base: React.CSSProperties = {
      position: 'absolute',
      width: '14px',
      height: '14px',
      transform: 'rotate(45deg)',
      background: 'hsl(var(--card) / 0.96)',
      borderLeft: '1px solid hsl(var(--border) / 0.85)',
      borderTop: '1px solid hsl(var(--border) / 0.85)',
      pointerEvents: 'none',
    };

    if (panelPlacement === 'bottom') {
      return { ...base, top: '-7px', left: `${pointerX}px` };
    }

    if (panelPlacement === 'top') {
      return { ...base, bottom: '-7px', left: `${pointerX}px` };
    }

    if (panelPlacement === 'left') {
      return { ...base, right: '-7px', top: `${pointerY}px` };
    }

    return { ...base, left: '-7px', top: `${pointerY}px` };
  })();

  useEffect(() => {
    if (!isOpen || isNavigating) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTypingField) {
        return;
      }

      if (event.key === 'Escape') {
        onSkip();
        return;
      }

      if (event.key === 'ArrowLeft' && !isFirstStep) {
        onPrev();
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        if (isLastStep) {
          onComplete();
        } else {
          onNext();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFirstStep, isLastStep, isNavigating, isOpen, onComplete, onNext, onPrev, onSkip]);

  if (isNavigating) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10010] flex items-center justify-center"
            style={{ background: 'rgba(3, 8, 17, 0.72)' }}
          >
            <div className="widget-shell border-primary/30 p-5">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span className="absolute inset-0 rounded-xl border border-primary/40 animate-ping" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Préparation de l'étape...</p>
                  <p className="text-xs text-muted-foreground">Navigation vers la bonne section</p>
                </div>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] backdrop-blur-[1.5px]"
            style={{
              background:
                'radial-gradient(circle at 18% 16%, hsl(var(--primary) / 0.16), transparent 40%), radial-gradient(circle at 84% 78%, hsl(var(--success) / 0.12), transparent 42%), rgba(3, 8, 17, 0.72)',
            }}
          />

          {targetPosition && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className="fixed z-[9999] rounded-2xl pointer-events-none"
                style={{
                  top: `${targetPosition.top}px`,
                  left: `${targetPosition.left}px`,
                  width: `${targetPosition.width}px`,
                  height: `${targetPosition.height}px`,
                  boxShadow: '0 0 0 9999px rgba(3, 8, 17, 0.74), 0 22px 44px rgba(0, 0, 0, 0.35)',
                  border: '1px solid hsl(var(--primary) / 0.7)',
                }}
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed z-[10000] rounded-2xl pointer-events-none border border-primary/40"
                style={{
                  top: `${targetPosition.top - 3}px`,
                  left: `${targetPosition.left - 3}px`,
                  width: `${targetPosition.width + 6}px`,
                  height: `${targetPosition.height + 6}px`,
                }}
              />
            </>
          )}

          <motion.section
            key={`${stepData.id}-${currentStep}`}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={panelStyle}
            className="widget-shell max-h-[calc(100vh-32px)] overflow-y-auto border-primary/25 p-4 sm:p-5 shadow-[0_28px_70px_rgba(0,0,0,0.45)] supports-[backdrop-filter]:bg-card/80"
            role="dialog"
            aria-modal="true"
            aria-label="Guide de prise en main"
          >
            {pointerStyle && <span style={pointerStyle} />}

            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-2xl gradient-primary text-primary-foreground flex items-center justify-center shadow-md">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-success animate-pulse" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="rounded-full border border-border/70 px-2 py-0.5">Onboarding</span>
                  <span className="truncate">{pageLabel}</span>
                </div>
                <h3 className="mt-2 text-base font-semibold leading-tight text-foreground">{stepData.title}</h3>
              </div>

              <button
                onClick={onSkip}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                aria-label="Fermer le guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stepData.content}</p>

            <div className="mt-3 rounded-xl border border-border/70 bg-muted/25 p-3 flex items-start gap-2.5">
              <div className="mt-0.5 h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{mascotTip}</p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <motion.div
                  className="h-full gradient-primary"
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Étape {currentStep + 1} sur {totalSteps}
                </span>
                <span>{Math.round(progressPercent)}%</span>
              </div>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      index === currentStep
                        ? 'w-6 bg-primary'
                        : index < currentStep
                          ? 'w-3 bg-primary/55'
                          : 'w-3 bg-muted'
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrev}
                disabled={isFirstStep}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={onSkip}>
                  Passer
                </Button>

                <Button
                  size="sm"
                  onClick={isLastStep ? onComplete : onNext}
                  className="gap-1 gradient-primary text-primary-foreground hover:opacity-90"
                >
                  {isLastStep ? 'Terminer' : 'Suivant'}
                  {!isLastStep && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Keyboard className="h-3.5 w-3.5" />
              Raccourcis: Esc pour quitter, flèches pour naviguer
            </p>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}