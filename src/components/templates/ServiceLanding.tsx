import { SeoHelmet } from "@/components/SEO/SeoHelmet";
import { SchemaMarkup } from "@/components/SEO/SchemaMarkup";
import { SERVICE_SCHEMA, BREADCRUMB_SCHEMA, FAQ_SCHEMA, SITE_URL } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface ServiceLandingProps {
  slug: string;
  title: string;
  heroSubtitle: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  benefits: string[];
  process: Array<{ title: string; desc: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  whatsappMessage: string;
}

export function ServiceLanding({
  slug,
  title,
  heroSubtitle,
  metaTitle,
  metaDescription,
  keywords,
  benefits,
  process,
  faqs = [],
  whatsappMessage,
}: ServiceLandingProps) {
  const url = `${SITE_URL}/servicios/${slug}`;
  const serviceSchema = SERVICE_SCHEMA({
    name: title,
    description: metaDescription,
    image: `${SITE_URL}/og-image.png`,
    url,
  });
  const breadcrumbs = BREADCRUMB_SCHEMA([
    { name: "Inicio", url: SITE_URL },
    { name: "Servicios", url: `${SITE_URL}/servicios` },
    { name: title, url },
  ]);
  const waLink = `https://wa.me/52555000000?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      <SeoHelmet title={metaTitle} description={metaDescription} keywords={keywords} url={url} canonical={url} />
      <SchemaMarkup schema={serviceSchema} />
      <SchemaMarkup schema={breadcrumbs} />
      {faqs.length > 0 && <SchemaMarkup schema={FAQ_SCHEMA(faqs)} />}

      <div className="min-h-screen bg-white">
        <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-blue-100">
              <Link to="/" className="hover:text-white">Inicio</Link> / <span className="text-white">{title}</span>
            </nav>
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">{title}</h1>
              <p className="text-xl text-blue-100 mb-8">{heroSubtitle}</p>
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <a href={waLink}>Solicitar Diagnóstico <ArrowRight className="ml-2 h-5 w-5" /></a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Qué incluye este servicio</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-4">
                  <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-900 font-medium">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Nuestro proceso</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {process.map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-4xl font-bold text-blue-600 mb-4">{idx + 1}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {faqs.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-10">Preguntas frecuentes</h2>
              <dl className="space-y-6">
                {faqs.map((f, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                    <dt className="font-semibold text-gray-900 mb-2">{f.question}</dt>
                    <dd className="text-gray-600">{f.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        <section className="py-16 bg-blue-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">¿Listo para dar el siguiente paso?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Agenda una sesión de diagnóstico con nuestros consultores y conoce cómo podemos fortalecer tu operación.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <a href={waLink}>Hablar por WhatsApp</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/schedule">Agendar diagnóstico</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
