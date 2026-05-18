import { Link } from "react-router-dom";
import logo from "@/assets/stratec-logo.png";

export const Logo = ({ variant = "dark", size = "md" }: { variant?: "dark" | "light"; size?: "sm" | "md" | "lg" }) => {
  const heights = { sm: "h-10", md: "h-12", lg: "h-20" };
  return (
    <Link to="/" className="inline-flex items-center group" aria-label="STRATEC — Consultoría en Seguridad">
      <img
        src={logo}
        alt="STRATEC — Consultoría en Seguridad"
        className={`${heights[size]} w-auto object-contain transition-opacity duration-300 ${
          variant === "light" ? "brightness-0 invert" : ""
        }`}
      />
    </Link>
  );
};
