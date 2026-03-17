import type { ReactNode } from "react";
import { BackendProvider } from "@/contexts/BackendContext";
import { TourProvider } from "@/contexts/TourContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppOverlays from "@/components/AppOverlays";

interface ProtectedAppShellProps {
  children: ReactNode;
}

export default function ProtectedAppShell({ children }: ProtectedAppShellProps) {
  return (
    <WebSocketProvider>
      <BackendProvider>
        <TourProvider>
          <AppOverlays>
            <ProtectedRoute>{children}</ProtectedRoute>
          </AppOverlays>
        </TourProvider>
      </BackendProvider>
    </WebSocketProvider>
  );
}
