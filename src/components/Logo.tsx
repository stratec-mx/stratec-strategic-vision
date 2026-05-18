import { Link } from "react-router-dom";
import logo from "@/assets/stratec-logo.png";

export const Logo = ({ variant = "dark" }: { variant?: "dark" | "light" }) => (
  <Link to="/" className="flex items-center gap-3 group">
    <img src={logo} alt="STRATEC" className="h-9 w-9 object-contain" width={36} height={36} />
    <div className="flex flex-col leading-none">
      <span className={`text-base font-semibold tracking-[0.25em] ${variant === "light" ? "text-smoke" : "text-navy"}`}>
        STRATEC
      </span>
      <span className={`text-[9px] mt-1 tracking-[0.3em] uppercase ${variant === "light" ? "text-smoke/60" : "text-steel"}`}>
        Strategic Intelligence
      </span>
    </div>
  </Link>
);
