import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./contexts/SettingsContext";
import { useTheme } from "./hooks/useTheme";

const AppOverlays = lazy(() => import("./components/AppOverlays"));
const Landing = lazy(() => import("./pages/Landing"));
const Landing2 = lazy(() => import("./pages/Landing2"));
const Landing3 = lazy(() => import("./pages/Landing3"));
const Auth = lazy(() => import("./pages/Auth"));
const ProtectedAppShell = lazy(() => import("./components/ProtectedAppShell"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Comparison = lazy(() => import("./pages/Comparison"));
const Sensors = lazy(() => import("./pages/Sensors"));
const SensorDetail = lazy(() => import("./pages/SensorDetail"));
const SensorMap = lazy(() => import("./pages/SensorMap"));
const Alerts = lazy(() => import("./pages/Alerts"));
const AlertHistory = lazy(() => import("./pages/AlertHistory"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Video = lazy(() => import("./pages/Video"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => {
  // Ensure the global light/dark class is always applied, even on routes without theme controls.
  useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/landing-2" element={<Landing2 />} />
              <Route path="/landing-3" element={<Landing3 />} />
              <Route path="/auth" element={<AppOverlays><Auth /></AppOverlays>} />
              <Route path="/dashboard" element={<ProtectedAppShell><Dashboard /></ProtectedAppShell>} />
              <Route path="/analytics" element={<ProtectedAppShell><Analytics /></ProtectedAppShell>} />
              <Route path="/comparison" element={<ProtectedAppShell><Comparison /></ProtectedAppShell>} />
              <Route path="/sensors" element={<ProtectedAppShell><Sensors /></ProtectedAppShell>} />
              <Route path="/sensors/:sensorId" element={<ProtectedAppShell><SensorDetail /></ProtectedAppShell>} />
              <Route path="/sensor-map" element={<ProtectedAppShell><SensorMap /></ProtectedAppShell>} />
              <Route path="/alerts" element={<ProtectedAppShell><Alerts /></ProtectedAppShell>} />
              <Route path="/alert-history" element={<ProtectedAppShell><AlertHistory /></ProtectedAppShell>} />
              <Route path="/reports" element={<ProtectedAppShell><Reports /></ProtectedAppShell>} />
              <Route path="/recommendations" element={<ProtectedAppShell><Recommendations /></ProtectedAppShell>} />
              <Route path="/maintenance" element={<ProtectedAppShell><Maintenance /></ProtectedAppShell>} />
              <Route path="/settings" element={<ProtectedAppShell><Settings /></ProtectedAppShell>} />
              <Route path="/admin" element={<ProtectedAppShell requireAdmin><Admin /></ProtectedAppShell>} />
              <Route path="/video" element={<ProtectedAppShell><Video /></ProtectedAppShell>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
