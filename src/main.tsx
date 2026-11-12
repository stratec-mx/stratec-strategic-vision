import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { preloadRoute } from "./routes/preloadRoute";
import "./index.css";

// Tope de espera: con una conexión muy lenta se monta de todos modos y la
// página termina de llegar con el aviso de "Cargando…".
const PRELOAD_TIMEOUT_MS = 8000;

const mount = () => {
  createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
};

// Cada página pública es un archivo aparte. Antes de montar se descarga la que
// corresponde a la dirección actual: así React cambia el HTML prerenderizado
// directo por la página real, sin pantalla vacía ni saltos. Si la descarga
// falla o tarda demasiado, se monta igual.
const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, PRELOAD_TIMEOUT_MS));

Promise.race([preloadRoute(window.location.pathname), timeout])
  .catch((error) => console.error("No se pudo adelantar la descarga de la página:", error))
  .then(mount);
