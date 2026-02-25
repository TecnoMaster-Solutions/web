// components/layout/Footer.jsx

"use client";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-800 border-t border-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-8 text-center md:text-left">
        {/* Columna 1: Derechos de autor */}
        <div className="flex flex-col items-center md:items-start">
          <p className="mt-4 text-xl-2 text-red-600">
            © {new Date().getFullYear()} SISTEMAS PC. <br />
            Todos los derechos reservados
          </p>
        </div>

        {/* Columna 2: Logo y descripción */}
        <div className="flex flex-col items-center md:items-start">
          <Image
            src="/assets/imgs/logo.png"
            alt="Sistemas PC"
            width={120}
            height={60}
            priority
          />
          <p className="mt-3 text-xl-2 text-gray-600 max-w-[200px]">
            Expertos en desarrollo y soluciones a medida.
          </p>
        </div>

        {/* Columna 3: Compañía */}
        <div>
          <h4 className="text-red-700 text-xl-3 font-semibold mb-3 uppercase">
            Compañía
          </h4>
          <ul className="space-y-2 text-xl-2">
            {[
              { href: "/services", label: "Servicios" },
              { href: "/products", label: "Productos" },
              { href: "/about", label: "Quienes Somos" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="relative group">
                  <span className="relative z-10">{link.label}</span>
                  <span className="absolute left-0 -bottom-0.5 h-[2px] w-full origin-left scale-x-0 bg-red-700 transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 4: Redes Sociales */}
        <div>
          <h4 className="text-red-700 text-xl-3 font-semibold mb-3 uppercase">
            Redes Sociales
          </h4>
          <ul className="space-y-2 text-xl-2">
            {[
              { href: "#", label: "Instagram" },
              { href: "#", label: "Facebook" },
            ].map((social) => (
              <li key={social.label}>
                <a href={social.href} className="relative group">
                  <span className="relative z-10">{social.label}</span>
                  <span className="absolute left-0 -bottom-0.5 h-[2px] w-full origin-left scale-x-0 bg-red-700 transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Línea divisoria y links inferiores */}
      <div className="mt-2">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-end gap-16 text-sm text-gray-500">
          {[
            { href: "#", label: "Políticas de Privacidad" },
            { href: "#", label: "Términos de Uso" },
          ].map((link) => (
            <Link key={link.label} href={link.href} className="relative group">
              <span className="relative z-10">{link.label}</span>
              <span className="absolute left-0 -bottom-0.5 h-[2px] w-full origin-left scale-x-0 bg-red-700 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;