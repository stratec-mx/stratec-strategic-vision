import { SeoHelmet } from "@/components/SEO/SeoHelmet";
import { SchemaMarkup } from "@/components/SEO/SchemaMarkup";
import { LOCAL_BUSINESS_SCHEMA, BREADCRUMB_SCHEMA, SITE_URL } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export interface LocationLandingProps {
  slug: string;
  city: string;
  region: string;
  postalCode: string;
  address: string;
  phone: string;
  intro: string;
  industries: string[];
}

export function LocationLanding({
  slug, city, region, postalCode, address, phone, intro, industries,
}: LocationLandingProps) {
  const url = `${SITE_URL}/ubicaciones/${slug}`;
  const title = `STRATEC en ${city} | Consultoría de Seguridad Institucional`;
  const description = `Servicios de consultoría en seguridad institucional, protección civil y normatividad STPS en ${city}, ${region}. Atención local especializada.`;

  return (
    <>
      <SeoHelmet
        title={title}
        description={description}
        url={url}
        canonical={url}
        keywords={[`seguridad ${city}`, `consultoría seguridad ${city}`, `protección civil ${city}`, "nearshoring", "STPS"]}
      />
      <SchemaMarkup schema={LOCAL_BUSINESS_SCHEMA({ name: city, address, city, postalCode, phone })} />
      <SchemaMarkup schema={BREADCRUMB_SCHEMA([
        { name: "Inicio", url: SITE_URL },
        { name: "Ubicaciones", url: `${SITE_URL}/ubicaciones` },
        { name: city, url },
      ])} />

      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-slate-300 mb-4">
              <MapPin className="h-5 w-5" /> <span>{region}, México</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">STRATEC Security en {city}</h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl">{intro}</p>
            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-gray-100">
              <Link to="/schedule">Agendar diagnóstico en {city} <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Industrias que atendemos en {city}</h2>
              <ul className="space-y-3">
                {industries.map((ind, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <Building2 className="h-5 w-5 text-blue-600" /> {ind}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cobertura local</h2>
              <p className="text-gray-700 mb-4">{address}</p>
              <p className="text-gray-700 mb-6">Tel: <a className="text-blue-600 hover:underline" href={`tel:${phone}`}>{phone}</a></p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <a href={`https://wa.me/52555000000?text=${encodeURIComponent(`Quiero información sobre servicios en ${city}`)}`}>Contactar a un consultor</a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
