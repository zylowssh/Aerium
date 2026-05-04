import type { ReactNode } from "react";
import { BackendProvider } from "@/contexts/BackendContext";
import { TourProvider } from "@/contexts/TourContext";
import { useTourContext } from "@/contexts/TourContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppOverlays from "@/components/AppOverlays";
import AIChatWidget from "@/components/AIChatWidget";
import { TourGuide } from "@/components/tour/TourGuide";

interface ProtectedAppShellProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

function ProtectedAppShellContent({ children, requireAdmin = false }: ProtectedAppShellProps) {
  const {
    isOpen,
    currentStep,
    totalSteps,
    currentStepData,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useTourContext();

  return (
    <AppOverlays>
      <ProtectedRoute requireAdmin={requireAdmin}>
        <WebSocketProvider>
          {children}
          <AIChatWidget />
          <TourGuide
            isOpen={isOpen}
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepData={currentStepData}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipTour}
            onComplete={completeTour}
          />
        </WebSocketProvider>
      </ProtectedRoute>
    </AppOverlays>
  );
}

export default function ProtectedAppShell({ children, requireAdmin = false }: ProtectedAppShellProps) {
  return (
    <BackendProvider>
      <TourProvider>
        <ProtectedAppShellContent requireAdmin={requireAdmin}>{children}</ProtectedAppShellContent>
      </TourProvider>
    </BackendProvider>
  );
}
