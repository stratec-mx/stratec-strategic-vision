import { useEffect, useState } from "react";

declare function gtag(...args: unknown[]): void;
declare function fbq(...args: unknown[]): void;

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("stratec_cookies_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("stratec_cookies_consent", "all");
    setVisible(false);
    // Activar analytics si están disponibles
    if (typeof gtag !== "undefined") {
      gtag("consent", "update", { analytics_storage: "granted", ad_storage: "granted" });
    }
  };

  const reject = () => {
    localStorage.setItem("stratec_cookies_consent", "necessary");
    setVisible(false);
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
