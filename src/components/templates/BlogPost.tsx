import { SeoHelmet } from "@/components/SEO/SeoHelmet";
import { SchemaMarkup } from "@/components/SEO/SchemaMarkup";
import { BREADCRUMB_SCHEMA, SITE_URL } from "@/lib/seo";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, User } from "lucide-react";

export interface BlogPostProps {
  slug: string;
  title: string;
  description: string;
  date: string;
  author?: string;
  category: string;
  children: React.ReactNode;
}

export function BlogPost({ slug, title, description, date, author = "Equipo STRATEC", category, children }: BlogPostProps) {
  const url = `${SITE_URL}/blog/${slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: date,
    author: { "@type": "Organization", name: author },
    publisher: { "@type": "Organization", name: "STRATEC", logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
    mainEntityOfPage: url,
  };

  return (
    <>
      <SeoHelmet
        title={title}
        description={description}
        url={url}
        canonical={url}
        type="article"
        publishedDate={date}
        author={author}
      />
      <SchemaMarkup schema={articleSchema} />
      <SchemaMarkup schema={BREADCRUMB_SCHEMA([
        { name: "Inicio", url: SITE_URL },
        { name: "Blog", url: `${SITE_URL}/blog` },
        { name: title, url },
      ])} />

      <article className="min-h-screen bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8">
            <ArrowLeft className="h-4 w-4" /> Volver al blog
          </Link>
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">{category}</span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{title}</h1>
          <div className="flex items-center gap-6 text-sm text-gray-500 mb-10 pb-8 border-b border-gray-200">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(date).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span className="flex items-center gap-2"><User className="h-4 w-4" /> {author}</span>
          </div>
          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600">
            {children}
          </div>
        </div>
      </article>
    </>
  );
}
