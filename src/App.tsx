import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CookieBanner } from "@/components/CookieBanner";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { Header } from "@/components/Navigation/Header";
import { Footer } from "@/components/Navigation/Footer";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Schedule from "./pages/Schedule.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import Privacidad from "./pages/Privacidad.tsx";
import Terminos from "./pages/Terminos.tsx";
import Confidentiality from "./pages/Confidentiality.tsx";
import Auth from "./pages/Auth.tsx";
import { AppShell } from "./components/app/AppShell.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import Leads from "./pages/app/Leads.tsx";
import Clients from "./pages/app/Clients.tsx";
import Pipeline from "./pages/app/Pipeline.tsx";
import Quotes from "./pages/app/Quotes.tsx";
import Agenda from "./pages/app/Agenda.tsx";
import Analytics from "./pages/app/Analytics.tsx";
import { Messaging, Settings } from "./pages/app/Placeholders.tsx";
import ServiciosIndex from "./pages/Servicios/Index.tsx";
import AuditoriaSeguridad from "./pages/Servicios/AuditoriaSeguridad.tsx";
import ProteccionCivil from "./pages/Servicios/ProteccionCivil.tsx";
import GestionDocumental from "./pages/Servicios/GestionDocumental.tsx";
import NOM035 from "./pages/Servicios/NOM035.tsx";
import SeguridadEventos from "./pages/Servicios/SeguridadEventos.tsx";
import ControlAccesoBiometrico from "./pages/Servicios/ControlAccesoBiometrico.tsx";
import VideovigilanciaIA from "./pages/Servicios/VideovigilanciaIA.tsx";
import { Morelos, Cuernavaca, Jiutepec, Civac, Monterrey, Queretaro, Guadalajara } from "./pages/ubicaciones/index.tsx";
import BlogIndex from "./pages/blog/Index.tsx";
import { NOM035Post, NearshoringPost, ProteccionCivilPost, SeguridadIndustrialPost } from "./pages/blog/Posts.tsx";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieBanner />
        <WhatsAppFloat />
        <BrowserRouter>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacidad" element={<Privacidad />} />
                  <Route path="/terminos" element={<Terminos />} />
                  <Route path="/confidentiality" element={<Confidentiality />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Service Routes */}
                  <Route path="/servicios/auditoria-seguridad" element={<NotFound />} />
                  <Route path="/servicios/proteccion-civil" element={<NotFound />} />
                  <Route path="/servicios/gestion-documental" element={<NotFound />} />
                  <Route path="/servicios/nom-035" element={<NotFound />} />
                  <Route path="/servicios/seguridad-eventos" element={<NotFound />} />
                  <Route path="/servicios/control-acceso-biometrico" element={<NotFound />} />
                  <Route path="/servicios/videovigilancia-ia" element={<NotFound />} />

                  {/* Location Routes */}
                  <Route path="/ubicaciones/morelos" element={<NotFound />} />
                  <Route path="/ubicaciones/cuernavaca" element={<NotFound />} />
                  <Route path="/ubicaciones/monterrey" element={<NotFound />} />
                  <Route path="/ubicaciones/queretaro" element={<NotFound />} />
                  <Route path="/ubicaciones/guadalajara" element={<NotFound />} />

                  {/* Blog Routes */}
                  <Route path="/blog" element={<NotFound />} />
                  <Route path="/blog/nom-035" element={<NotFound />} />
                  <Route path="/blog/nearshoring" element={<NotFound />} />
                  <Route path="/blog/proteccion-civil" element={<NotFound />} />
                  <Route path="/blog/seguridad-industrial" element={<NotFound />} />

                  {/* App Routes */}
                  <Route path="/app" element={<AppShell />}>
                    <Route index element={<Dashboard />} />
                    <Route path="leads" element={<Leads />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="pipeline" element={<Pipeline />} />
                    <Route path="quotes" element={<Quotes />} />
                    <Route path="agenda" element={<Agenda />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="messaging" element={<Messaging />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="/admin/leads" element={<Navigate to="/app/leads" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
