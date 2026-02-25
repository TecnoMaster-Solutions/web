import { Mail, MapPin, Phone } from 'lucide-react';
import Container from '@/features/landing/contact/components/container';
import SectionTitle from '@/features/landing/contact/components/SectionTitle';
import Card from '@/features/landing/contact/components/Card';
import ContactMethod from '@/features/landing/contact/components/ContactMethod';
import SocialIcons from '@/features/landing/contact/components/SocialIcons';
import ContactForm from '@/features/landing/contact/components/ContactForm';
import Nav from '../layout/Nav';
import Footer from '../layout/Footer';

interface ContactProps {
  className?: string;
}

export default function Contact({ className = '' }: ContactProps) {
  return (
    <div className={className}>
      <Nav />

      {/* Hero Section */}
      <section className="section py-16 bg-white">
        <Container>
          <SectionTitle
            title="Formas de contacto"
            subtitle="Elige el canal que más te convenga para ponerte en contacto"
            className="text-center mb-12"
          />
        </Container>
      </section>

      {/* Contact Methods Section */}
      <section className="section py-16 bg-gray-50">
        <Container>
          <div className="grid md:grid-cols-3 gap-8">
            <Card
              variant="elevated"
              className="text-center p-8 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <ContactMethod
                icon={Mail}
                title="Correo electrónico"
                description="Escríbenos directamente"
                contact="ventas@empresa.com"
                className="text-red-600"
              />
            </Card>

            <Card
              variant="elevated"
              className="text-center p-8 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <ContactMethod
                icon={MapPin}
                title="Punto físico"
                description="Visítanos"
                contact="Monterrey"
                className="text-red-600"
              />
            </Card>

            <Card
              variant="elevated"
              className="text-center p-8 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <ContactMethod
                icon={Phone}
                title="Teléfono"
                description="Llámanos ahora"
                contact="+57 313 685 09 68"
                className="text-red-600"
              />
            </Card>
          </div>
        </Container>
      </section>

      {/* Contact Form Section */}
      <section className="section py-20 bg-gradient-to-br from-red-800 via-red-700 to-red-600 relative overflow-hidden">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-lg shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  Contáctanos
                </h3>
                <ContactForm />
              </div>
            </div>

            <div className="order-1 lg:order-2 text-white text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight">
                ¡Déjanos un correo!
              </h2>
              <div className="flex justify-center lg:justify-start">
                <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                  <Mail className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        </Container>
      </section>

      {/* Social Media Section */}
      <section className="section py-16 bg-gray-100">
        <Container>
          <SectionTitle
            title="Conoce nuestras redes sociales"
            subtitle="Síguenos para estar al día con nuestras novedades"
            className="text-center mb-12"
          />
          <div className="flex justify-center">
            <SocialIcons />
          </div>
        </Container>
      </section>

      <Footer />
    </div> 
  );
}