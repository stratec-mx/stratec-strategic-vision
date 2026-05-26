import { SeoHelmet } from "@/components/SEO/SeoHelmet";
import { SchemaMarkup } from "@/components/SEO/SchemaMarkup";
import { SERVICE_PAGES_SEO, SERVICE_SCHEMA, SITE_URL, BREADCRUMB_SCHEMA } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function GestionDocumentalPage() {
  const seoData = SERVICE_PAGES_SEO["gestion-documental"];
  const serviceSchema = SERVICE_SCHEMA({
    name: "Gestión Documental Normativa",
    description: "Sistemas de gestión documental conforme a NOM-035, ISO 31000 y regulaciones STPS. Cumplimiento normativo institucional.",
    image: `${SITE_URL}/services/gestion-documental.jpg`,
    url: `${SITE_URL}/servicios/gestion-documental`,
  });

  const breadcrumbs = BREADCRUMB_SCHEMA([
    { name: "Inicio", url: SITE_URL },
    { name: "Servicios", url: `${SITE_URL}/servicios` },
    { name: "Gestión Documental", url: `${SITE_URL}/servicios/gestion-documental` },
  ]);

  const benefits = [
    "Sistemas de gestión documental digitales",
    "Cumplimiento de NOM-035 e ISO 31000",
    "Auditoría y estructuración de archivos",
    "Gestión de políticas y procedimientos",
    "Trazabilidad y control de versiones",
    "Reportes de cumplimiento normativo",
  ];

  return (
    <>
      <SeoHelmet title={seoData.title} description={seoData.description} keywords={seoData.keywords} url={`${SITE_URL}/servicios/gestion-documental`} />
      <SchemaMarkup schema={serviceSchema} />
      <SchemaMarkup schema={breadcrumbs} />
      <div className="min-h-screen bg-white">
        <section className="relative bg-gradient-to-r from-purple-600 to-purple-800 text-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold mb-6">Gestión Documental Normativa</h1>
              <p className="text-xl text-purple-100 mb-8">Sistemas digitales de gestión documental conformes con regulaciones. Cumplimiento NOM-035, ISO 31000 y STPS.</p>
              <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                <a href="https://wa.me/52555000000?text=Quiero%20información%20sobre%20gestión%20documental">
                  Solicitar Consulta <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Servicios de Gestión Documental</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div><p className="text-gray-900 font-medium">{benefit}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Implementación</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Auditoría Documental", desc: "Evaluación del estado actual" },
                { step: "2", title: "Diseño del Sistema", desc: "Estructura conforme a normatividad" },
                { step: "3", title: "Implementación", desc: "Digitalización e integración" },
                { step: "4", title: "Capacitación", desc: "Entrenamiento y soporte continuo" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-4xl font-bold text-purple-600 mb-4">{item.step}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-16 bg-purple-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Gestión documental compliant</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">Digitaliza tus procesos documentales con sistemas que cumplen todas las regulaciones mexicanas.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700"><a href="https://wa.me/52555000000">Contactar</a></Button>
              <Button asChild variant="outline" size="lg"><Link to="/blog">Leer Más</Link></Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
