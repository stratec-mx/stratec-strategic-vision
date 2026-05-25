import { useEffect, useState } from "react";

type ConsentState = "accepted" | "rejected" | null;

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(null);

  useEffect(() => {
    const stored = localStorage.getItem("stratec_cookies_consent") as ConsentState;
    if (!stored) {
      setTimeout(() => setVisible(true), 1500);
    } else {
      setConsent(stored);
      if (stored === "accepted") {
        loadAnalytics();
      }
    }
  }, []);

  /**
   * Cargar Meta Pixel y Google Analytics 4 — SOLO tras consentimiento explícito
   * Esto cumple con LFPDPPP (Ley Federal de Protección de Datos Personales en Posesión de los Particulares)
   */
  const loadAnalytics = () => {
    // Google Analytics 4 — ID: G-9SEKJR2MC6
    if (typeof window !== "undefined" && !(window as any).gtag) {
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

    // Meta Pixel — ID: 978906281171528
    if (typeof window !== "undefined" && !(window as any).fbq) {
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
  };

  const accept = () => {
    localStorage.setItem("stratec_cookies_consent", "accepted");
    setConsent("accepted");
    setVisible(false);
    loadAnalytics();
    trackEvent("cookie_accepted");
  };

  const reject = () => {
    localStorage.setItem("stratec_cookies_consent", "rejected");
    setConsent("rejected");
    setVisible(false);
  };

  /**
   * Registrar evento de rechazo de cookies en GA4 (sin cargar Meta Pixel)
   */
  const trackEvent = (name: string) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", name, { event_category: "consent" });
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(11,13,20,0.97)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        zIndex: 900,
        flexWrap: "wrap",
      }}
    >
      <p style={{ color: "#8A8D9F", margin: 0, fontSize: 13, maxWidth: 620, lineHeight: 1.6 }}>
        Este sitio utiliza cookies analíticas para mejorar tu experiencia.{" "}
        <a
          href="/privacidad"
          style={{ color: "#7B7F42", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          Aviso de privacidad
        </a>
      </p>
      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        <button
          onClick={accept}
          style={{
            background: "#7B7F42",
            color: "#F7F7F5",
            border: "none",
            padding: "8px 20px",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Aceptar
        </button>
        <button
          onClick={reject}
          style={{
            background: "transparent",
            color: "#8A8D9F",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "8px 20px",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Solo necesarias
        </button>
      </div>
    </div>
  );
};
