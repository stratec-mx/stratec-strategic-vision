/**
 * Analytics Library — Google Analytics 4 + Meta Pixel
 *
 * Uso:
 * import { track } from "@/lib/analytics";
 * track.whatsappClick();
 * track.formSubmit("auditoría de seguridad");
 */

type AnalyticsParams = Record<string, string | number>;

/**
 * Registrar evento genérico en ambas plataformas
 */
export function trackEvent(
  eventName: string,
  params?: AnalyticsParams
) {
  // Google Analytics 4
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, {
      event_category: params?.category || "interaction",
      ...params,
    });
  }

  // Meta Pixel
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", "CustomEvent", { eventName, ...params });
  }
}

/**
 * Eventos predefinidos para usar en componentes
 * Cada evento es una función que encapsula el trackEvent correspondiente
 */
export const track = {
  /**
   * Click en botón de WhatsApp
   */
  whatsappClick: () =>
    trackEvent("click_whatsapp", {
      category: "contact",
      label: "whatsapp_cta",
      value: 1,
    }),

  /**
   * Click en botón de email
   */
  emailClick: () =>
    trackEvent("click_email", {
      category: "contact",
      label: "email_cta",
      value: 1,
    }),

  /**
   * Envío exitoso del formulario de contacto
   * @param service Servicio de interés (ej: "auditoría de seguridad")
   */
  formSubmit: (service: string) =>
    trackEvent("form_submit", {
      category: "lead",
      label: service,
      value: 1,
    }),

  /**
   * Usuario hizo scroll hasta la sección de contacto
   */
  scrollToContact: () =>
    trackEvent("scroll_to_contact", {
      category: "engagement",
      value: 1,
    }),

  /**
   * Descarga de lead magnet (checklist, guía, etc)
   */
  leadMagnetDownload: (name: string = "checklist_seguridad") =>
    trackEvent("download_leadmagnet", {
      category: "lead",
      label: name,
      value: 1,
    }),

  /**
   * Meta Pixel: Evento Lead (para pixel conversion tracking)
   * Disparar DESPUÉS de un formulario exitoso
   */
  metaLead: () => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Lead", {
        currency: "MXN",
        value: 0, // Ajustar según presupuesto promedio
      });
    }
  },

  /**
   * Meta Pixel: Evento de visualización de página específica
   */
  metaPageView: () => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "ViewContent");
    }
  },

  /**
   * Aceptación de cookies (se dispara automáticamente en CookieBanner)
   */
  cookieAccepted: () =>
    trackEvent("cookie_accepted", {
      category: "consent",
      value: 1,
    }),

  /**
   * Rechazo de cookies (se dispara automáticamente en CookieBanner)
   */
  cookieRejected: () =>
    trackEvent("cookie_rejected", {
      category: "consent",
      value: 1,
    }),

  /**
   * Click en CTA principal (botón "Solicitar diagnóstico")
   */
  ctaClick: (label: string = "main_cta") =>
    trackEvent("cta_click", {
      category: "engagement",
      label,
      value: 1,
    }),

  /**
   * Visualización de sección específica
   * @param section Nombre de la sección (ej: "servicios", "metodología", "casos")
   */
  sectionView: (section: string) =>
    trackEvent("section_view", {
      category: "engagement",
      label: section,
      value: 1,
    }),
};

/**
 * Inicializar Google Analytics 4 manualmente si no se cargó via banner
 * Usar solo en casos especiales
 */
export function initGA4() {
  if (typeof window === "undefined") return;

  if (!(window as any).gtag) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-9SEKJR2MC6";
    document.head.appendChild(script);

    const inlineScript = document.createElement("script");
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-9SEKJR2MC6', { 'anonymize_ip': true });
    `;
    document.head.appendChild(inlineScript);
  }
}

/**
 * Inicializar Meta Pixel manualmente si no se cargó via banner
 * Usar solo en casos especiales
 */
export function initMetaPixel() {
  if (typeof window === "undefined") return;

  if (!(window as any).fbq) {
    const script = document.createElement("script");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '978906281171528');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }
}

/**
 * Obtener estado actual de consentimiento de cookies
 */
export function getConsentStatus(): "accepted" | "rejected" | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("stratec_cookies_consent") as "accepted" | "rejected" | null;
}
