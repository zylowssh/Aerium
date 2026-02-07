import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./contexts/SettingsContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
  import { TourProvider } from "./contexts/TourContext";
  import { BackendProvider } from "./contexts/BackendContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Landing2 from "./pages/Landing2";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Comparison from "./pages/Comparison";
import Sensors from "./pages/Sensors";
import SensorDetail from "./pages/SensorDetail";
import SensorMap from "./pages/SensorMap";
import Alerts from "./pages/Alerts";
import AlertHistory from "./pages/AlertHistory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Recommendations from "./pages/Recommendations";
import Maintenance from "./pages/Maintenance";
import Video from "./pages/Video";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <WebSocketProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <BackendProvider>
                <TourProvider>
               <Routes>
                 <Route path="/" element={<Landing />} />
                 <Route path="/landing-2" element={<Landing2 />} />
                 <Route path="/auth" element={<Auth />} />
                 <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                 <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                 <Route path="/comparison" element={<ProtectedRoute><Comparison /></ProtectedRoute>} />
                 <Route path="/sensors" element={<ProtectedRoute><Sensors /></ProtectedRoute>} />
                 <Route path="/sensors/:sensorId" element={<ProtectedRoute><SensorDetail /></ProtectedRoute>} />
                 <Route path="/sensor-map" element={<ProtectedRoute><SensorMap /></ProtectedRoute>} />
                 <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
                 <Route path="/alert-history" element={<ProtectedRoute><AlertHistory /></ProtectedRoute>} />
                 <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                 <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
                 <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
                 <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                 <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                 <Route path="/video" element={<ProtectedRoute><Video /></ProtectedRoute>} />
                 {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                 <Route path="*" element={<NotFound />} />
               </Routes>
                </TourProvider>
              </BackendProvider>
            </BrowserRouter>
          </TooltipProvider>
      </WebSocketProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
