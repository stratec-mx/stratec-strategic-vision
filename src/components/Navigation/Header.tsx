import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const serviceLinks = [
    { href: "/servicios/auditoria-seguridad", label: "Auditoría de Seguridad" },
    { href: "/servicios/proteccion-civil", label: "Protección Civil" },
    { href: "/servicios/gestion-documental", label: "Gestión Documental" },
    { href: "/servicios/nom-035", label: "Evaluación NOM-035" },
    { href: "/servicios/seguridad-eventos", label: "Seguridad de Eventos" },
    { href: "/servicios/control-acceso-biometrico", label: "Control de Acceso" },
    { href: "/servicios/videovigilancia-ia", label: "Videovigilancia IA" },
  ];

  const locationLinks = [
    { href: "/ubicaciones/morelos", label: "Morelos" },
    { href: "/ubicaciones/monterrey", label: "Monterrey" },
    { href: "/ubicaciones/queretaro", label: "Querétaro" },
    { href: "/ubicaciones/guadalajara", label: "Guadalajara" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700" />
            <span className="text-xl font-bold text-gray-900">STRATEC</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <div className="group relative">
              <button className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Servicios
              </button>
              <div className="absolute left-0 top-full hidden w-64 rounded-lg bg-white shadow-lg pt-2 group-hover:block">
                {serviceLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="group relative">
              <button className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Ubicaciones
              </button>
              <div className="absolute left-0 top-full hidden w-48 rounded-lg bg-white shadow-lg pt-2 group-hover:block">
                {locationLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/blog" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Blog
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Acceder</Link>
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
              <a href="https://wa.me/52555000000?text=Hola,%20quiero%20más%20información%20sobre%20servicios%20de%20STRATEC">
                Consulta Gratis
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-900" />
            ) : (
              <Menu className="h-6 w-6 text-gray-900" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 py-4 md:hidden">
            <div className="space-y-4">
              <div>
                <h3 className="px-4 text-sm font-semibold text-gray-900 mb-2">Servicios</h3>
                {serviceLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div>
                <h3 className="px-4 text-sm font-semibold text-gray-900 mb-2">Ubicaciones</h3>
                {locationLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <Link to="/blog" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Blog
              </Link>
              <div className="border-t border-gray-200 pt-4 px-4 space-y-2">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link to="/auth">Acceder</Link>
                </Button>
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                  <a href="https://wa.me/52555000000?text=Hola,%20quiero%20más%20información%20sobre%20servicios%20de%20STRATEC">
                    Consulta Gratis
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
