import { Helmet } from "react-helmet-async";
import { SITE_NAME, SITE_URL, SeoMetadata, DEFAULT_SEO } from "@/lib/seo";

interface SeoHelmetProps extends Partial<SeoMetadata> {
  children?: React.ReactNode;
}

export function SeoHelmet({
  title,
  description,
  image,
  url,
  type = "website",
  keywords = [],
  canonical,
  noindex = false,
  author,
  publishedDate,
  modifiedDate,
  children
}: SeoHelmetProps) {
  const pageTitle = title || DEFAULT_SEO.title;
  const pageDescription = description || DEFAULT_SEO.description;
  const pageImage = image || DEFAULT_SEO.image;
  const pageUrl = url || SITE_URL;
  const pageKeywords = keywords.length > 0 ? keywords.join(", ") : DEFAULT_SEO.keywords?.join(", ");
  const canonicalUrl = canonical || pageUrl;

  const fullTitle = pageTitle.includes(SITE_NAME) ? pageTitle : `${pageTitle} | ${SITE_NAME}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="charset" content="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="theme-color" content="#ffffff" />

      {/* Index Control */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_MX" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:creator" content="@STRATEC" />

      {/* Article Meta Tags */}
      {type === "article" && (
        <>
          {author && <meta name="author" content={author} />}
          {publishedDate && <meta property="article:published_time" content={publishedDate} />}
          {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}
          <meta property="article:author" content="STRATEC" />
          <meta property="article:section" content="Consultoría Empresarial" />
        </>
      )}

      {/* Preconnect to external services */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* Additional preloads for fonts */}
      <link rel="preload" as="font" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />

      {/* Mobile optimization */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />

      {/* Additional SEO Tags */}
      <link rel="alternate" hrefLang="es-MX" href={pageUrl} />
      <link rel="alternate" hrefLang="en-US" href={pageUrl.replace("/", "-en/")} />
      <link rel="alternate" hrefLang="x-default" href={pageUrl} />

      {children}
    </Helmet>
  );
}
