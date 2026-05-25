/**
 * Custom hook to automatically update SEO meta tags based on route
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSEOConfig, updateMetaTags } from "@/config/seo";

/**
 * Updates all SEO meta tags based on the current route
 * Usage: Call this hook in any page component to automatically update meta tags
 *
 * @example
 * const Page = () => {
 *   useSEO();
 *   return <div>Page content</div>;
 * };
 */
export const useSEO = () => {
  const location = useLocation();

  useEffect(() => {
    const seoConfig = getSEOConfig(location.pathname);
    updateMetaTags(seoConfig);

    // Scroll to top on route change for better UX
    window.scrollTo(0, 0);
  }, [location.pathname]);
};
