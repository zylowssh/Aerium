import type { ReactNode } from "react";
import { BackendProvider } from "@/contexts/BackendContext";
import { TourProvider } from "@/contexts/TourContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppOverlays from "@/components/AppOverlays";
import AIChatWidget from "@/components/AIChatWidget";

interface ProtectedAppShellProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedAppShell({ children, requireAdmin = false }: ProtectedAppShellProps) {
  return (
    <BackendProvider>
      <TourProvider>
        <AppOverlays>
          <ProtectedRoute requireAdmin={requireAdmin}>
            <WebSocketProvider>
              {children}
              <AIChatWidget />
            </WebSocketProvider>
          </ProtectedRoute>
        </AppOverlays>
      </TourProvider>
    </BackendProvider>
  );
}
