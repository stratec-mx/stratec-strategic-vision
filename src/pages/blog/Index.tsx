import { SeoHelmet } from "@/components/SEO/SeoHelmet";
import { SITE_URL } from "@/lib/seo";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const POSTS = [
  { slug: "nom-035", title: "NOM-035: Guía completa de cumplimiento 2026", excerpt: "Cómo implementar la NOM-035-STPS-2018 en tu organización paso a paso.", category: "Normatividad", date: "2026-05-01" },
  { slug: "nearshoring", title: "Nearshoring en México: seguridad para nuevas operaciones", excerpt: "Riesgos, mitigaciones y mejores prácticas para empresas que aterrizan en México.", category: "Nearshoring", date: "2026-04-15" },
  { slug: "proteccion-civil", title: "Protección Civil corporativa: planes que sí funcionan", excerpt: "Cómo diseñar planes de emergencia auditables y operativos.", category: "Protección Civil", date: "2026-03-20" },
  { slug: "seguridad-industrial", title: "Seguridad industrial: del cumplimiento a la cultura", excerpt: "Llevar la seguridad industrial de check-list a ventaja competitiva.", category: "Industrial", date: "2026-02-10" },
];

export default function BlogIndex() {
  return (
    <>
      <SeoHelmet
        title="Blog STRATEC | Seguridad Institucional, NOM-035 y Nearshoring"
        description="Análisis, guías y mejores prácticas sobre seguridad institucional, normatividad STPS, nearshoring y protección civil en México."
        url={`${SITE_URL}/blog`}
        canonical={`${SITE_URL}/blog`}
      />
      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog STRATEC</h1>
            <p className="text-xl text-slate-200 max-w-3xl">Inteligencia estratégica, normatividad y tendencias en seguridad institucional.</p>
          </div>
        </section>
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
            {POSTS.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-500 transition">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">{p.category}</span>
                <h2 className="text-xl font-bold text-gray-900 mt-2 mb-3">{p.title}</h2>
                <p className="text-gray-600 mb-4">{p.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium">Leer artículo <ArrowRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
