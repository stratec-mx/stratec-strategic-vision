import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { CookieBanner } from "@/components/CookieBanner";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { ChatLauncher } from "@/components/chat/ChatLauncher";
import { RouteErrorBoundary } from "./routes/RouteErrorBoundary";
import { CargandoPagina } from "./routes/RouteFallbacks";
import { routeElements } from "./routes/routes";
import { usePreloadOnIntent } from "./routes/usePreloadOnIntent";

// Las rutas viven en src/routes/routes.tsx. Cada página pública se descarga
// aparte, solo cuando se visita; la de la dirección inicial llega antes de
// montar React (ver main.tsx) para no dejar la pantalla vacía.

const queryClient = new QueryClient();

// Inner component to access useLocation hook within BrowserRouter
const AppRoutes = () => {
  useSEO();
  usePreloadOnIntent();
  const { pathname } = useLocation();

  return (
    <AuthProvider>
      <RouteErrorBoundary resetKey={pathname}>
        {/* Solo se ve al navegar a una página que aún no se ha descargado */}
        <Suspense fallback={<CargandoPagina />}>
          <Routes>{routeElements}</Routes>
        </Suspense>
      </RouteErrorBoundary>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CookieBanner />
      <WhatsAppFloat />
      <BrowserRouter>
        <AppRoutes />
        <ChatLauncher />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
