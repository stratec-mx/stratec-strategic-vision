import { SeoHelmet } from "@/components/SEO/SeoHelmet";
import { SITE_URL } from "@/lib/seo";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Camera, FileCheck2 } from "lucide-react";

const groups = [
  {
    title: "Consultoría Estratégica",
    icon: ShieldCheck,
    items: [
      { slug: "auditoria-seguridad", name: "Auditoría de Seguridad" },
    ],
  },
  {
    title: "Integración Tecnológica",
    icon: Camera,
    items: [
      { slug: "videovigilancia-ia", name: "Videovigilancia con IA" },
      { slug: "control-acceso-biometrico", name: "Control de Acceso Biométrico" },
    ],
  },
  {
    title: "Gestión Operativa y Normativa",
    icon: FileCheck2,
    items: [
      { slug: "proteccion-civil", name: "Protección Civil" },
      { slug: "gestion-documental", name: "Gestión Documental" },
      { slug: "nom-035", name: "Evaluación NOM-035" },
      { slug: "seguridad-eventos", name: "Seguridad de Eventos" },
    ],
  },
];

export default function ServiciosIndex() {
  return (
    <>
      <SeoHelmet
        title="Servicios de Consultoría en Seguridad Institucional | STRATEC"
        description="Consultoría estratégica, integración tecnológica y gestión operativa normativa para industria, gobierno y nearshoring en México."
        url={`${SITE_URL}/servicios`}
        canonical={`${SITE_URL}/servicios`}
      />
      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Servicios STRATEC</h1>
            <p className="text-xl text-blue-100 max-w-3xl">
              Soluciones enterprise para organizaciones que no admiten margen de error.
            </p>
          </div>
        </section>
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
            {groups.map((g) => (
              <div key={g.title}>
                <div className="flex items-center gap-3 mb-6">
                  <g.icon className="h-7 w-7 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">{g.title}</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {g.items.map((it) => (
                    <Link
                      key={it.slug}
                      to={`/servicios/${it.slug}`}
                      className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{it.name}</h3>
                      <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium">
                        Ver detalle <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
