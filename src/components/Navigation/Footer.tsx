import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const services = [
    { href: "/servicios/auditoria-seguridad", label: "Auditoría de Seguridad" },
    { href: "/servicios/proteccion-civil", label: "Protección Civil" },
    { href: "/servicios/gestion-documental", label: "Gestión Documental" },
    { href: "/servicios/nom-035", label: "NOM-035" },
    { href: "/servicios/seguridad-eventos", label: "Seguridad de Eventos" },
    { href: "/servicios/control-acceso-biometrico", label: "Control de Acceso" },
    { href: "/servicios/videovigilancia-ia", label: "Videovigilancia IA" },
  ];

  const locations = [
    { href: "/ubicaciones/morelos", label: "Morelos" },
    { href: "/ubicaciones/cuernavaca", label: "Cuernavaca" },
    { href: "/ubicaciones/monterrey", label: "Monterrey" },
    { href: "/ubicaciones/queretaro", label: "Querétaro" },
    { href: "/ubicaciones/guadalajara", label: "Guadalajara" },
  ];

  const resources = [
    { href: "/blog", label: "Blog" },
    { href: "/blog/nom-035", label: "Guía NOM-035" },
    { href: "/blog/nearshoring", label: "Nearshoring Seguro" },
    { href: "/blog/proteccion-civil", label: "Protección Civil" },
  ];

  const legal = [
    { href: "/privacy", label: "Privacidad" },
    { href: "/terms", label: "Términos" },
    { href: "/privacidad", label: "Privacidad (ES)" },
    { href: "/terminos", label: "Términos (ES)" },
  ];

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700" />
              <span className="text-lg font-bold text-gray-900">STRATEC</span>
            </div>
            <p className="text-sm text-gray-600">
              Consultoría estratégica en seguridad institucional, nearshoring y protección civil.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <a href="tel:+5255500000" className="hover:text-gray-900">
                  +52 55 5000 0000
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@stratec.mx" className="hover:text-gray-900">
                  info@stratec.mx
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Morelos, México</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Servicios</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.href}>
                  <Link
                    to={service.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Ubicaciones</h3>
            <ul className="space-y-2">
              {locations.map((location) => (
                <li key={location.href}>
                  <Link
                    to={location.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {location.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Recursos</h3>
            <ul className="space-y-2">
              {resources.map((resource) => (
                <li key={resource.href}>
                  <Link
                    to={resource.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {resource.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-600">
              © 2010-{new Date().getFullYear()} STRATEC. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://linkedin.com/company/stratec"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://facebook.com/stratec"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/stratec"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm3.172-10c0 1.769-1.403 3.172-3.172 3.172-1.769 0-3.172-1.403-3.172-3.172 0-1.769 1.403-3.172 3.172-3.172 1.769 0 3.172 1.403 3.172 3.172zm2.713-5.886c0 .505-.41.915-.915.915s-.915-.41-.915-.915.41-.915.915-.915.915.41.915.915z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
