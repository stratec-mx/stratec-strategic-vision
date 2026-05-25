import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const nav = [
  { label: "Firma", href: "#about" },
  { label: "Servicios", href: "#services" },
  { label: "Sectores", href: "#sectors" },
  { label: "Metodología", href: "#methodology" },
  { label: "Tecnología", href: "#technology" },
  { label: "Casos", href: "#cases" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    setOpen(false);
    if (isHome) {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/${hash}`);
    }
  };

  const transparent = isHome && !scrolled;
  const logoVariant = transparent ? "light" : "dark";
  const linkColor = transparent ? "text-smoke/80 hover:text-smoke" : "text-steel hover:text-navy";
  const menuColor = transparent ? "text-smoke" : "text-navy";

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled || !isHome ? "bg-smoke/85 backdrop-blur-md border-b border-border shadow-lg shadow-navy/5" : "bg-transparent"
      }`}
    >
      <div className="container-wide flex items-center justify-between h-24">
        <Logo size="md" variant={logoVariant} />
        <nav className="hidden lg:flex items-center gap-10">
          {nav.map((item) => (
            <motion.a
              key={item.href}
              href={isHome ? item.href : `/${item.href}`}
              onClick={(e) => handleNav(e, item.href)}
              className={`text-sm transition-colors duration-300 tracking-wide relative group ${linkColor}`}
              whileHover={{ scale: 1.05 }}
            >
              {item.label}
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-olive origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild variant="ghost" size="sm" className={`rounded-none text-xs uppercase tracking-wider h-10 transition-all duration-300 ${transparent ? "text-smoke hover:text-smoke hover:bg-smoke/10" : "text-navy hover:text-navy hover:bg-secondary"}`}>
              <a href="/auth">Acceso</a>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild variant="default" size="sm" className="rounded-none bg-navy hover:bg-navy-deep text-smoke tracking-wider text-xs uppercase px-6 h-10 transition-all duration-300 hover:shadow-lg hover:shadow-navy/30">
              <a href={isHome ? "#contact" : "/#contact"} onClick={(e) => handleNav(e, "#contact")}>Diagnóstico</a>
            </Button>
          </motion.div>
        </div>
        <button className={`lg:hidden ${menuColor}`} onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden bg-smoke border-t border-border">
          <nav className="container-wide py-6 flex flex-col gap-4">
            {nav.map((item) => (
              <a
                key={item.href}
                href={isHome ? item.href : `/${item.href}`}
                onClick={(e) => handleNav(e, item.href)}
                className="text-sm text-steel hover:text-navy py-2"
              >
                {item.label}
              </a>
            ))}
            <a
              href={isHome ? "#contact" : "/#contact"}
              onClick={(e) => handleNav(e, "#contact")}
              className="text-sm text-navy font-semibold py-2 border-t border-border pt-4"
            >
              Solicitar diagnóstico →
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};
