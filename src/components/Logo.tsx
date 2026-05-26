import { Link } from "react-router-dom";
import mark from "@/assets/stratec-mark.png";

export const Logo = ({ variant = "dark", size = "md" }: { variant?: "dark" | "light"; size?: "sm" | "md" | "lg" }) => {
  const markSize = { sm: "h-9 w-9", md: "h-10 w-10", lg: "h-14 w-14" }[size];
  const titleSize = { sm: "text-base", md: "text-lg", lg: "text-2xl" }[size];
  const taglineSize = { sm: "text-[8px]", md: "text-[9px]", lg: "text-[10px]" }[size];

  const titleColor = variant === "light" ? "text-smoke" : "text-smoke";
  const taglineColor = variant === "light" ? "text-smoke/50" : "text-[#C4A04A]";

  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group" aria-label="STRATEC Security — Consultoría de Seguridad Institucional">
      <img
        src={mark}
        alt="STRATEC Mark"
        className={`${markSize} object-contain shrink-0 transition-opacity group-hover:opacity-80`}
        style={variant === "light" ? { filter: "brightness(0) invert(1)" } : {}}
      />
      <div className="flex flex-col leading-tight">
        <span className={`${titleSize} ${titleColor} font-light tracking-[0.2em] uppercase`}>STRATEC</span>
        <span className={`${taglineSize} ${taglineColor} mt-1 tracking-[0.15em] uppercase font-light`}>
          SECURITY
        </span>
      </div>
    </Link>
  );
};
