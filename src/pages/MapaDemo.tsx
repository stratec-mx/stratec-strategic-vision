// Página demo del mapa de seguridad interactivo.
// Ruta temporal /mapa-demo para validar el componente antes de integrarlo
// en el diagnóstico público y en la inspección interna.

import { useState } from "react";
import { SecurityMap } from "@/components/security-map/SecurityMap";
import {
  SecurityMarker,
  DEFAULT_MARKER_KINDS,
  INSPECTION_MARKER_KINDS,
} from "@/components/security-map/types";

export default function MapaDemo() {
  const [clientMarks, setClientMarks] = useState<SecurityMarker[]>([]);
  const [inspMarks, setInspMarks] = useState<SecurityMarker[]>([]);

  return (
    <div className="min-h-screen bg-smoke py-12">
      <div className="container-wide max-w-4xl mx-auto px-4 space-y-16">
        <header>
          <div className="eyebrow mb-2">— Demo técnico</div>
          <h1 className="font-display text-3xl text-navy font-light">Mapa interactivo de seguridad</h1>
          <p className="mt-2 text-sm text-steel max-w-2xl">
            Satélite real (Esri), marcadores que se fijan a coordenadas. El mismo componente
            se usa en el diagnóstico del cliente y en la inspección interna, cambiando la paleta.
          </p>
        </header>

        {/* Uso 1: diagnóstico público */}
        <section>
          <h2 className="font-display text-xl text-navy mb-1">1 · Diagnóstico del cliente</h2>
          <p className="text-sm text-steel mb-4">
            El cliente ubica su predio y marca lo que le preocupa. Paleta simple, no técnica.
          </p>
          <SecurityMap
            value={clientMarks}
            onChange={setClientMarks}
            kinds={DEFAULT_MARKER_KINDS}
            helpText="Busca tu dirección o usa tu ubicación, luego toca el mapa para marcar accesos, puntos ciegos y zonas que te preocupan."
          />
        </section>

        {/* Uso 2: inspección interna */}
        <section>
          <h2 className="font-display text-xl text-navy mb-1">2 · Inspección técnica interna</h2>
          <p className="text-sm text-steel mb-4">
            Mismo mapa, paleta técnica para el levantamiento de equipo y vulnerabilidades.
          </p>
          <SecurityMap
            value={inspMarks}
            onChange={setInspMarks}
            kinds={INSPECTION_MARKER_KINDS}
            helpText="Coloca cámaras, controles de acceso y marca vulnerabilidades y zonas críticas sobre el predio."
          />
        </section>

        {/* Salida de datos (lo que se guardaría / enviaría al PDF) */}
        <section>
          <h2 className="font-display text-xl text-navy mb-3">Datos capturados</h2>
          <pre className="bg-navy-deep text-smoke/80 text-xs p-4 overflow-auto max-h-72">
{JSON.stringify({ diagnostico: clientMarks, inspeccion: inspMarks }, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}
