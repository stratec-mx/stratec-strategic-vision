import { SeoHelmet } from "@/components/SEO/SeoHelmet";
import { SchemaMarkup } from "@/components/SEO/SchemaMarkup";
import { SERVICE_PAGES_SEO, SERVICE_SCHEMA, SITE_URL, BREADCRUMB_SCHEMA } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuditoriasegurridadPage() {
  const seoData = SERVICE_PAGES_SEO.auditoria;
  const serviceSchema = SERVICE_SCHEMA({
    name: "Auditoría de Seguridad Institucional",
    description: "Auditorías completas de seguridad para instituciones, empresas e industria. Análisis de vulnerabilidades, protocolos y soluciones estratégicas.",
    image: `${SITE_URL}/services/auditoria.jpg`,
    url: `${SITE_URL}/servicios/auditoria-seguridad`,
  });

  const breadcrumbs = BREADCRUMB_SCHEMA([
    { name: "Inicio", url: SITE_URL },
    { name: "Servicios", url: `${SITE_URL}/servicios` },
    { name: "Auditoría de Seguridad", url: `${SITE_URL}/servicios/auditoria-seguridad` },
  ]);

  const benefits = [
    "Evaluación exhaustiva de sistemas de seguridad",
    "Identificación de vulnerabilidades críticas",
    "Análisis de riesgos estratificado",
    "Reporte ejecutivo con recomendaciones",
    "Plan de implementación personalizado",
    "Seguimiento y validación de mejoras",
  ];

  return (
    <>
      <SeoHelmet
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={`${SITE_URL}/servicios/auditoria-seguridad`}
      />
      <SchemaMarkup schema={serviceSchema} />
      <SchemaMarkup schema={breadcrumbs} />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold mb-6">Auditoría de Seguridad Institucional</h1>
              <p className="text-xl text-blue-100 mb-8">
                Evaluación exhaustiva de sus sistemas y protocolos de seguridad. Identifique vulnerabilidades críticas y fortalezca su postura de riesgo.
              </p>
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <a href="https://wa.me/52555000000?text=Quiero%20solicitar%20una%20auditoría%20de%20seguridad">
                  Solicitar Auditoría <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Lo que incluye nuestra auditoría</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-gray-900 font-medium">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Nuestro proceso</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Diagnóstico Inicial", desc: "Evaluación de tu contexto y requerimientos" },
                { step: "2", title: "Auditoría Técnica", desc: "Análisis detallado de sistemas y protocolos" },
                { step: "3", title: "Análisis de Riesgos", desc: "Identificación y clasificación de vulnerabilidades" },
                { step: "4", title: "Reporte y Plan", desc: "Documento ejecutivo con roadmap de mejora" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-4xl font-bold text-blue-600 mb-4">{item.step}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              ¿Listo para fortalecer tu seguridad?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Nuestros expertos en seguridad institucional están listos para evaluar tu postura actual y diseñar una estrategia personalizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <a href="https://wa.me/52555000000?text=Quiero%20solicitar%20una%20auditoría%20de%20seguridad">
                  Contactar a Expertos
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/blog">Leer Más sobre Seguridad</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
