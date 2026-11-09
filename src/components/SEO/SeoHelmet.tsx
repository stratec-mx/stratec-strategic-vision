import { Helmet } from "react-helmet-async";
import type { SeoMetadata } from "@/lib/seo";

interface SeoHelmetProps extends Partial<SeoMetadata> {
  children?: React.ReactNode;
}

/**
 * Etiquetas específicas de una página. Título, descripción, canónica y Open
 * Graph los administra useSEO (config/seo.ts) para que nunca haya duplicados.
 */
export function SeoHelmet({ type = "website", noindex = false, author, publishedDate, modifiedDate, children }: SeoHelmetProps) {
  return (
    <Helmet>
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {type === "article" && author && <meta name="author" content={author} />}
      {type === "article" && publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {type === "article" && modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}
      {children}
    </Helmet>
  );
}
