import type { Metadata } from 'next';
import Image from 'next/image';
import { Target, Eye, Flag, ChevronDown } from 'lucide-react';
import Container from '@/features/landing/about/components/Container';
import SectionTitle from '@/features/landing/about/components/SectionTitle';
import Card from '@/features/landing/about/components/Card';
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
    answer: "Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 2:00 PM. También puedes contactarnos por email en cualquier momento."
  },
  {
    question: "¿Cómo solicitar una cotización?",
    answer: "Puedes solicitar una cotización a través de nuestro formulario de contacto, por teléfono o por email. Te responderemos en un máximo de 24 horas con una propuesta personalizada."
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos transferencias bancarias, tarjetas de crédito y débito, PayPal, y pagos en efectivo. También ofrecemos planes de financiamiento para proyectos grandes."
  },
  {
    question: "¿Ofrecen garantía en sus servicios?",
    answer: "Sí, todos nuestros servicios incluyen garantía. El período varía según el tipo de servicio, pero generalmente ofrecemos entre 6 meses a 2 años de garantía."
  },
  {
    question: "¿Trabajan con empresas de todos los tamaños?",
    answer: "Absolutamente. Trabajamos desde emprendedores y pequeñas empresas hasta grandes corporaciones. Adaptamos nuestras soluciones a las necesidades específicas de cada cliente."
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

      {/* Hero Section */}
      <section className="bg-red-600 text-white relative overflow-hidden">
        {/* Contenido principal */}
        <div className="relative z-10 py-16 lg:py-20">
          <Container>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Columna de texto */}
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Sobre Nosotros
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-red-100">
                  Somos una empresa comprometida con la excelencia, la innovación y el crecimiento de nuestros clientes. Con más de una década de experiencia, hemos ayudado a cientos de empresas a alcanzar sus objetivos.
                </p>
              </div>
              
              {/* Columna de imagen */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-72 h-48 md:w-96 md:h-64 lg:w-[400px] lg:h-[280px] rounded-xl overflow-hidden shadow-2xl">
                  <Image
                    src="/assets/imgs/about.png"
                    alt="Paneles solares - energía renovable"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </Container>
        </div>
        
        {/* Onda decorativa */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg
            className="relative block w-full h-16 lg:h-20"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,120V73.71c47.79-22.2,103.59-32.17,158-28,70.36,5.37,136.33,33.31,206.8,37.5C438.64,87.57,512.34,66.33,583,47.95c69.27-18,138.3-24.88,209.4-13.08,36.15,6,69.85,17.84,104.45,29.34C989.49,95,1113,134.29,1200,67.53V120Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Sección de Pilares */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Nuestros Pilares
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card de Visión */}
            <Card variant="pillar">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-10 h-10 text-gray-800" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">VISIÓN</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ser la empresa líder en nuestro sector, reconocida por la calidad 
                de nuestros servicios y el impacto positivo en la comunidad empresarial.
              </p>
            </Card>

            {/* Card de Misión */}
            <Card variant="pillar">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-gray-800" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">MISIÓN</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Proporcionar soluciones innovadoras y personalizadas que impulsen 
                el crecimiento y éxito de nuestros clientes, superando sus expectativas.
              </p>
            </Card>

            {/* Card de Objetivo */}
            <Card variant="pillar">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Flag className="w-10 h-10 text-gray-800" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">OBJETIVO</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Mantener la excelencia en cada proyecto, construir relaciones duraderas 
                y contribuir al desarrollo sostenible del sector empresarial.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* Sección de FAQ */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          {/* Título y subtítulo centrados */}
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-gray-600">
              Encuentra respuestas a las consultas más comunes
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
};