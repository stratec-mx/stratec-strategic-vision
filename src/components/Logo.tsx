import { Link } from "react-router-dom";
import mark from "@/assets/stratec-mark.png";

export const Logo = ({ variant = "dark", size = "md" }: { variant?: "dark" | "light"; size?: "sm" | "md" | "lg" }) => {
  const markSize = { sm: "h-10 w-10", md: "h-12 w-12", lg: "h-16 w-16" }[size];
  const titleSize = { sm: "text-lg", md: "text-xl", lg: "text-3xl" }[size];
  const taglineSize = { sm: "text-[9px]", md: "text-[10px]", lg: "text-xs" }[size];

  const titleColor = variant === "light" ? "text-smoke" : "text-navy";
  const taglineColor = variant === "light" ? "text-smoke/60" : "text-steel";

  return (
    <Link to="/" className="inline-flex items-center gap-3 group" aria-label="STRATEC — Consultoría en Seguridad">
      <img
        src={mark}
        alt=""
        className={`${markSize} object-contain shrink-0 ${variant === "light" ? "brightness-0 invert" : ""}`}
      />
      <div className="flex flex-col leading-none">
        <span className={`${titleSize} ${titleColor} font-semibold tracking-[0.28em]`}>STRATEC</span>
        <span className={`${taglineSize} ${taglineColor} mt-1.5 tracking-[0.22em] uppercase`}>
          Consultoría en Seguridad
        </span>
      </div>
    </Link>
  );
};
