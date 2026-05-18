import { useEffect, useState } from "react";
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-smoke/85 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container-wide flex items-center justify-between h-24">
        <Logo size="md" />
        <nav className="hidden lg:flex items-center gap-10">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-steel hover:text-navy transition-colors duration-300 tracking-wide"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Button asChild variant="default" size="sm" className="rounded-none bg-navy hover:bg-navy-deep text-smoke tracking-wider text-xs uppercase px-6 h-10">
            <a href="#contact">Diagnóstico</a>
          </Button>
        </div>
        <button className="lg:hidden text-navy" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden bg-smoke border-t border-border">
          <nav className="container-wide py-6 flex flex-col gap-4">
            {nav.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="text-sm text-steel hover:text-navy py-2">
                {item.label}
              </a>
            ))}
            <a href="#contact" onClick={() => setOpen(false)} className="text-sm text-navy font-semibold py-2 border-t border-border pt-4">
              Solicitar diagnóstico →
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};
