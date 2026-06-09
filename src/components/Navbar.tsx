import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

type NavItem =
  | { label: string; href: string; to?: never }
  | { label: string; to: string; href?: never };

const nav: NavItem[] = [
  { label: "Firma",       href: "#about" },
  { label: "Servicios",   href: "#services" },
  { label: "Sectores",    href: "#sectors" },
  { label: "Metodología", href: "#methodology" },
  { label: "Tecnología",  href: "#technology" },
  { label: "Casos",       href: "#cases" },
  { label: "Oferta",      to: "/servicios" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleNav = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    setOpen(false);
    if (isHome) {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/?${hash}`);
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const transparent = isHome && !scrolled;
  const logoVariant = transparent ? "light" : "dark";
  const linkColor = transparent ? "text-smoke/70 hover:text-smoke" : "text-smoke/60 hover:text-smoke";
  const menuColor = transparent ? "text-smoke" : "text-smoke";

  return (
    <header
      className={`header-stratec fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled || !isHome
          ? "bg-[rgba(10,10,15,0.95)] backdrop-blur-md border-b border-[rgba(196,160,74,0.15)] shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="container-wide flex items-center justify-between h-20">
        {/* Logo — única representación del nombre */}
        <Logo size="md" variant={logoVariant} />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {nav.map((item) =>
            item.to ? (
              // Enlace directo de React Router (sin anchor)
              <Link
                key={item.to}
                to={item.to}
                className={`text-[0.85rem] transition-colors duration-200 tracking-[0.15em] uppercase font-light relative group ${linkColor}`}
              >
                {item.label}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-[#C4A04A] origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            ) : (
              // Enlace de anchor (scroll o navigate)
              <motion.a
                key={item.href}
                href={isHome ? item.href : `/?${item.href}`}
                onClick={(e) => handleNav(e, item.href!)}
                className={`text-[0.85rem] transition-colors duration-200 tracking-[0.15em] uppercase font-light relative group ${linkColor}`}
                whileHover={{ scale: 1.05 }}
              >
                {item.label}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-[#C4A04A] origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.a>
            )
          )}
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-none text-xs uppercase tracking-wider h-12 px-6 transition-all duration-300 bg-transparent border border-[rgba(196,160,74,0.4)] text-[#C4A04A] hover:bg-[rgba(196,160,74,0.08)] hover:text-[#C4A04A] hover:border-[#C4A04A]"
            >
              <a href="/auth">Acceso</a>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              size="sm"
              className="rounded-none bg-[#C4A04A] hover:bg-[#C4A04A]/90 text-[#0A0A0F] tracking-wider text-xs uppercase px-6 h-12 transition-all duration-300 hover:shadow-lg hover:shadow-[#C4A04A]/30 font-semibold"
            >
              <a href={isHome ? "#contact" : "/?#contact"} onClick={(e) => handleNav(e, "#contact")}>
                Diagnóstico
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`lg:hidden ${menuColor} hover:text-smoke transition-colors`}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden bg-[#0A0A0F] border-t border-[rgba(196,160,74,0.15)]"
        >
          <nav className="container-wide py-8 flex flex-col gap-6">
            {nav.map((item) =>
              item.to ? (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm text-smoke/70 hover:text-smoke transition-colors py-2 uppercase tracking-wider font-light"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={isHome ? item.href : `/?${item.href}`}
                  onClick={(e) => handleNav(e, item.href!)}
                  className="text-sm text-smoke/70 hover:text-smoke transition-colors py-2 uppercase tracking-wider font-light"
                >
                  {item.label}
                </a>
              )
            )}
            <div className="border-t border-[rgba(196,160,74,0.15)] pt-6 mt-2 flex flex-col gap-4">
              <a
                href="/auth"
                className="text-sm text-[#C4A04A] py-2 uppercase tracking-wider font-light border border-[rgba(196,160,74,0.4)] text-center hover:bg-[rgba(196,160,74,0.08)] transition-colors"
              >
                Acceso
              </a>
              <a
                href={isHome ? "#contact" : "/?#contact"}
                onClick={(e) => handleNav(e, "#contact")}
                className="text-sm text-[#C4A04A] font-semibold py-2 uppercase tracking-wider"
              >
                Solicitar diagnóstico →
              </a>
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  );
};
