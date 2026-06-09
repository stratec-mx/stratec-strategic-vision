import { Logo } from "./Logo";
import { Linkedin, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-navy-deep text-smoke/70 pt-20 pb-10 border-t border-olive/20">
      <div className="container-wide">
        <div className="grid lg:grid-cols-12 gap-12 pb-16 border-b border-smoke/10">
          {/* Brand Section */}
          <div className="lg:col-span-4">
            <Logo variant="light" size="lg" />
            <p className="mt-6 text-sm leading-relaxed text-smoke/50 max-w-sm font-light">
              Consultoría en seguridad e inteligencia estratégica para instituciones que operan en entornos de alta exigencia.
            </p>
          </div>

          {/* Services Navigation */}
          <div className="lg:col-span-2">
            <div className="text-xs uppercase tracking-widest text-smoke mb-5">Servicios</div>
            <ul className="space-y-3 text-sm">
              <li><Link to="/servicios/consultoria-seguridad" className="hover:text-smoke transition-colors font-light">Consultoría en Seguridad</Link></li>
              <li><Link to="/servicios/proteccion-civil" className="hover:text-smoke transition-colors font-light">Protección Civil</Link></li>
              <li><Link to="/servicios/capacitacion" className="hover:text-smoke transition-colors font-light">Capacitación</Link></li>
              <li><Link to="/servicios/integracion-tecnologica" className="hover:text-smoke transition-colors font-light">Integración Tecnológica</Link></li>
              <li><Link to="/servicios/consultoria-gobierno" className="hover:text-smoke transition-colors font-light">Gobierno e Instituciones</Link></li>
            </ul>
          </div>

          {/* Coverage Navigation */}
          <div className="lg:col-span-2">
            <div className="text-xs uppercase tracking-widest text-smoke mb-5">Cobertura</div>
            <ul className="space-y-3 text-sm">
              <li><Link to="/cobertura/morelos" className="hover:text-smoke transition-colors font-light">Morelos</Link></li>
              <li><Link to="/cobertura/cdmx" className="hover:text-smoke transition-colors font-light">Ciudad de México</Link></li>
              <li><Link to="/cobertura/puebla" className="hover:text-smoke transition-colors font-light">Puebla</Link></li>
              <li><Link to="/cobertura/guerrero" className="hover:text-smoke transition-colors font-light">Guerrero</Link></li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="lg:col-span-2">
            <div className="text-xs uppercase tracking-widest text-smoke mb-5">Contacto</div>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-olive mt-0.5 shrink-0" />
                <a href="mailto:contacto@stratecsecurity.com" className="hover:text-smoke transition-colors font-light">
                  contacto@stratecsecurity.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-olive mt-0.5 shrink-0" />
                <span className="font-light">Morelos, México</span>
              </li>
              <li className="flex items-start gap-3">
                <Linkedin className="h-4 w-4 text-olive mt-0.5 shrink-0" />
                <a
                  href="https://www.linkedin.com/company/stratec-security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-smoke transition-colors font-light"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between gap-4 text-xs text-smoke/40">
          <div className="font-light">© {new Date().getFullYear()} STRATEC Security. Todos los derechos reservados.</div>
          <div className="flex gap-6">
            <Link to="/privacidad" className="hover:text-smoke transition-colors font-light">Aviso de privacidad</Link>
            <Link to="/terminos" className="hover:text-smoke transition-colors font-light">Términos</Link>
            <Link to="/confidentiality" className="hover:text-smoke transition-colors font-light">Confidencialidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
