// components/layout/Footer.tsx

"use client";
import Link from "next/link";
import { routes } from "@/shared/routes";

const Footer = () => {
  return (
    <footer className="bg-[#04652c] text-white border-t border-[#034d22]">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">

        {/* Columna 1: TecnoMaster (Logo y tagline) */}
        <div className="flex flex-col items-center md:items-start space-y-4">
          <div className="inline-block">
            <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              TecnoMaster
            </span>
          </div>
          <p className="text-gray-300 text-sm max-w-[250px] leading-relaxed">
            Expertos en desarrollo y soluciones a medida.
          </p>
        </div>

        {/* Columna 2: Compañía */}
        <div className="flex flex-col items-center md:items-start">
          <h4 className="text-white text-lg font-bold mb-4 uppercase tracking-wider">
            Compañía
          </h4>
          <ul className="space-y-3 text-gray-300">
            {[
              { href: routes.path, label: "Inicio" },
              { href: routes.landing.services, label: "Servicios" },
              { href: routes.landing.products, label: "Productos" },
              { href: routes.landing.contact, label: "Contacto" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="relative group hover:text-white transition-colors duration-300">
                  <span className="relative z-10">{link.label}</span>
                  <span className="absolute left-0 -bottom-1 h-[2px] w-full origin-left scale-x-0 bg-[#06a646] transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3: Redes Sociales */}
        <div className="flex flex-col items-center md:items-start">
          <h4 className="text-white text-lg font-bold mb-4 uppercase tracking-wider">
            Redes Sociales
          </h4>
          <ul className="space-y-3 text-gray-300">
            {[
              { href: "#", label: "Instagram" },
              { href: "#", label: "Facebook" },
            ].map((social) => (
              <li key={social.label}>
                <a href={social.href} className="relative group hover:text-white transition-colors duration-300">
                  <span className="relative z-10">{social.label}</span>
                  <span className="absolute left-0 -bottom-1 h-[2px] w-full origin-left scale-x-0 bg-[#06a646] transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#034d22] bg-[#034d22]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>
            © {new Date().getFullYear()} TecnoMaster. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors duration-300">
              Privacidad
            </Link>
            <Link href="#" className="hover:text-white transition-colors duration-300">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
