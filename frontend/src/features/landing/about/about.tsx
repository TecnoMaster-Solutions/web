import type { Metadata } from 'next';
import Image from 'next/image';
import { Target, Eye, Flag } from 'lucide-react';
import Container from '@/features/landing/about/components/Container';
import { JSX } from 'react';
import Nav from '../layout/Nav';
import Footer from '../layout/Footer';
import Accordion from './components/Accordion';

/**
 * Interface para definir la estructura de cada item del FAQ
 */
interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Interface para el schema de datos estructurados de Schema.org
 */
interface OrganizationSchema {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
  contactPoint: {
    "@type": string;
    telephone: string;
    contactType: string;
    email: string;
    areaServed: string;
    availableLanguage: string[];
  };
}

/**
 * Metadata para SEO
 */
export const metadata: Metadata = {
  title: 'Sobre Nosotros',
  description: 'Conoce más sobre Tu Empresa, nuestra misión, visión y valores que nos guían para ofrecer las mejores soluciones.',
};

/**
 * Array de preguntas frecuentes
 */
const faqItems: FAQItem[] = [
  {
    question: "¿Cuál es su horario de atención al cliente?",
    answer: "De lunes a viernes desde las 8:00 A.M. hasta las 6:00 P.M. Sábados de 8:00 A.M. hasta las 12:00 P.M."
  },
  {
    question: "¿Cómo puedo solicitar una cotización para paneles solares?",
    answer: "Puedes solicitar una cotización a través de nuestro formulario de contacto, por teléfono o por email. Te responderemos en un máximo de 24 horas con una propuesta personalizada."
  },
  {
    question: "¿Ofrecen soporte técnico especializado post-venta?",
    answer: "Sí, todos nuestros servicios incluyen garantía y soporte técnico especializado. Contamos con un equipo de expertos listos para atender cualquier requerimiento después de la instalación."
  }
];

/**
 * Datos estructurados para SEO
 */
const organizationSchema: OrganizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Tu Empresa",
  "url": "https://tuempresa.com",
  "logo": "https://tuempresa.com/logo.png",
  "sameAs": [
    "https://facebook.com/tuempresa",
    "https://instagram.com/tuempresa"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+52-55-1234-5678",
    "contactType": "customer service",
    "email": "soporte@empresa.com",
    "areaServed": "MX",
    "availableLanguage": ["Spanish"]
  }
};

/**
 * Componente principal de la página "Sobre Nosotros"
 */
export default function About(): JSX.Element {
  return (
    <>
      <Nav />

      {/* JSON-LD Schema para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />

      {/* Hero Section - Sobre Nosotros */}
      <section className="bg-[#f0f7f0] relative py-16 lg:py-24">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Columna Izquierda: Título y Texto */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8">
                Sobre <span className="text-[#04652c]">Nosotros</span>
              </h1>

              <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-50 max-w-xl">
                <p className="text-gray-700 leading-relaxed mb-6 font-medium">
                  Somos una empresa líder en desarrollo de soluciones tecnológicas innovadoras, comprometida con la excelencia y la satisfacción de nuestros clientes.
                </p>
                <p className="text-gray-700 leading-relaxed font-medium">
                  Nuestra pasión por la sostenibilidad nos impulsa a crear herramientas digitales que optimizan el uso de energías renovables, llevando la tecnología solar al siguiente nivel de eficiencia.
                </p>
              </div>
            </div>

            {/* Columna Derecha: Imagen */}
            <div className="relative group">
              <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                <Image
                  src="/assets/imgs/about.png"
                  alt="Tecnología y Sostenibilidad - TecnoMaster"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Overlay decorativo suave */}
              <div className="absolute inset-0 rounded-[40px] ring-1 ring-black/5 pointer-events-none"></div>
            </div>
          </div>
        </Container>
      </section>


      {/* Sección de Pilares */}
      <section className="py-20 lg:py-28 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 inline-block relative">
              Nuestros <span className="text-[#04652c]">Pilares</span>
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#04652c] rounded-full"></div>
            </h2>
            <p className="text-lg text-gray-500 mt-6 max-w-2xl mx-auto font-medium">
              Valores fundamentales que guían cada uno de nuestros proyectos y decisiones.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card de Visión */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col">
              {/* Parte Superior: Icono y Fondo Gris */}
              <div className="bg-[#f8f9fa] py-12 flex justify-center items-center">
                <div className="w-20 h-20 bg-[#e8f5e9] rounded-full flex items-center justify-center">
                  <Eye className="w-10 h-10 text-[#04652c]" />
                </div>
              </div>
              {/* Parte Inferior: Contenido */}
              <div className="p-8 text-center flex-grow">
                <h3 className="text-2xl font-bold mb-4 text-[#04652c]">Visión</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  Ser referentes globales en la implementación de tecnologías verdes, transformando la manera en que el mundo consume energía.
                </p>
              </div>
            </div>

            {/* Card de Misión */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col">
              <div className="bg-[#f8f9fa] py-12 flex justify-center items-center">
                <div className="w-20 h-20 bg-[#e8f5e9] rounded-full flex items-center justify-center">
                  <Target className="w-10 h-10 text-[#04652c]" />
                </div>
              </div>
              <div className="p-8 text-center flex-grow">
                <h3 className="text-2xl font-bold mb-4 text-[#04652c]">Misión</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  Proveer soluciones tecnológicas de vanguardia que faciliten la transición hacia un futuro energético sostenible y eficiente.
                </p>
              </div>
            </div>

            {/* Card de Objetivo */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col">
              <div className="bg-[#f8f9fa] py-12 flex justify-center items-center">
                <div className="w-20 h-20 bg-[#e8f5e9] rounded-full flex items-center justify-center">
                  <Flag className="w-10 h-10 text-[#04652c]" />
                </div>
              </div>
              <div className="p-8 text-center flex-grow">
                <h3 className="text-2xl font-bold mb-4 text-[#04652c]">Objetivo</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  Alcanzar la máxima satisfacción del cliente mediante la innovación continua y el compromiso con la calidad técnica.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>


      {/* Sección de FAQ */}
      <section className="py-20 lg:py-28 bg-[#f8f9fa]">
        <Container>
          {/* Título y subtítulo centrados */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              Encuentra respuestas a las consultas más comunes sobre nuestros servicios y tecnología.
            </p>
          </div>

          {/* Componente Accordion */}
          <div className="max-w-4xl mx-auto">
            <Accordion items={faqItems} />
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}