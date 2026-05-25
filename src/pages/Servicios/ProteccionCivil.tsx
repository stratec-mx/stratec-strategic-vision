import { SeoHelmet } from "@/components/SEO/SeoHelmet";
import { SchemaMarkup } from "@/components/SEO/SchemaMarkup";
import { SERVICE_PAGES_SEO, SERVICE_SCHEMA, SITE_URL, BREADCRUMB_SCHEMA } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProteccionCivilPage() {
  const seoData = SERVICE_PAGES_SEO["proteccion-civil"];
  const serviceSchema = SERVICE_SCHEMA({
    name: "Protección Civil y Gestión de Emergencias",
    description: "Soluciones integrales de protección civil, planes de emergencia, coordinación de eventos y respuesta a contingencias.",
    image: `${SITE_URL}/services/proteccion-civil.jpg`,
    url: `${SITE_URL}/servicios/proteccion-civil`,
  });

  const breadcrumbs = BREADCRUMB_SCHEMA([
    { name: "Inicio", url: SITE_URL },
    { name: "Servicios", url: `${SITE_URL}/servicios` },
    { name: "Protección Civil", url: `${SITE_URL}/servicios/proteccion-civil` },
  ]);

  const benefits = [
    "Planes de emergencia y contingencia",
    "Coordinación de respuesta ante crisis",
    "Capacitación de equipos de emergencia",
    "Protocolos de evacuación",
    "Simulacros y ejercicios prácticos",
    "Certificación en cumplimiento normativo",
  ];

  return (
    <>
      <SeoHelmet title={seoData.title} description={seoData.description} keywords={seoData.keywords} url={`${SITE_URL}/servicios/proteccion-civil`} />
      <SchemaMarkup schema={serviceSchema} />
      <SchemaMarkup schema={breadcrumbs} />
      <div className="min-h-screen bg-white">
        <section className="relative bg-gradient-to-r from-emerald-600 to-emerald-800 text-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold mb-6">Protección Civil y Gestión de Emergencias</h1>
              <p className="text-xl text-emerald-100 mb-8">Respuesta integral ante contingencias. Planes, coordinación y capacitación para proteger a tu organización.</p>
              <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                <a href="https://wa.me/52555000000?text=Quiero%20información%20sobre%20protección%20civil">
                  Solicitar Consulta <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Servicios de Protección Civil</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div><p className="text-gray-900 font-medium">{benefit}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Nuestro proceso</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Análisis de Riesgos", desc: "Identificación de escenarios de contingencia" },
                { step: "2", title: "Diseño del Plan", desc: "Desarrollo de protocolos personalizados" },
                { step: "3", title: "Capacitación", desc: "Entrenamiento de equipos de respuesta" },
                { step: "4", title: "Simulacros", desc: "Pruebas y validación operativa" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-4xl font-bold text-emerald-600 mb-4">{item.step}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-16 bg-emerald-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Prepara tu organización para cualquier eventualidad</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">Nuestro equipo de expertos en protección civil diseñará un plan integral adaptado a tus necesidades específicas.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700"><a href="https://wa.me/52555000000">Contactar</a></Button>
              <Button asChild variant="outline" size="lg"><Link to="/blog">Leer Guías</Link></Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
