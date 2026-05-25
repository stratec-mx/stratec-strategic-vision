import { Logo } from "./Logo";
import { Linkedin, Mail, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-carbon text-smoke/70 pt-20 pb-10">
      <div className="container-wide">
        <div className="grid lg:grid-cols-12 gap-12 pb-16 border-b border-smoke/10">
          <div className="lg:col-span-4">
            <Logo variant="light" size="lg" />
            <p className="mt-6 text-sm leading-relaxed text-smoke/50 max-w-sm font-light">
              Consultoría en seguridad e inteligencia estratégica para instituciones que operan en entornos de alta exigencia.
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs uppercase tracking-widest text-smoke mb-5">Firma</div>
            <ul className="space-y-3 text-sm">
              <li><a href="#about" className="hover:text-smoke transition-colors">Sobre STRATEC</a></li>
              <li><a href="#services" className="hover:text-smoke transition-colors">Servicios</a></li>
              <li><a href="#methodology" className="hover:text-smoke transition-colors">Metodología</a></li>
              <li><a href="#cases" className="hover:text-smoke transition-colors">Casos</a></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs uppercase tracking-widest text-smoke mb-5">Sectores</div>
            <ul className="space-y-3 text-sm">
              <li>Gobierno</li>
              <li>Corporativo</li>
              <li>Industria</li>
              <li>Infraestructura</li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <div className="text-xs uppercase tracking-widest text-smoke mb-5">Contacto institucional</div>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3"><Mail className="h-4 w-4 text-olive mt-0.5" /><a href="mailto:contacto@stratecsecurity.com" className="hover:text-smoke transition-colors">contacto@stratecsecurity.com</a></li>
              <li className="flex items-start gap-3"><MapPin className="h-4 w-4 text-olive mt-0.5" /><span>México — Operaciones en toda la región</span></li>
              <li className="flex items-start gap-3"><Linkedin className="h-4 w-4 text-olive mt-0.5" /><a href="https://www.linkedin.com/company/stratec-security" target="_blank" rel="noopener noreferrer" className="hover:text-smoke transition-colors">LinkedIn</a></li>
              <li className="text-xs text-smoke/30">Lunes a viernes, 9:00 — 18:00 (CST)</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between gap-4 text-xs text-smoke/40">
          <div>© {new Date().getFullYear()} STRATEC. Todos los derechos reservados.</div>
          <div className="flex gap-6">
            <a href="/privacidad" className="hover:text-smoke">Aviso de privacidad</a>
            <a href="/terminos" className="hover:text-smoke">Términos</a>
            <a href="/confidentiality" className="hover:text-smoke">Confidencialidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
