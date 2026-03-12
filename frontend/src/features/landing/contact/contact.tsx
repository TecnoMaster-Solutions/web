import { Mail, MapPin, Phone, SendHorizontal } from 'lucide-react';
import Container from '@/features/landing/contact/components/container';
import Card from '@/features/landing/contact/components/Card';
import ContactMethod from '@/features/landing/contact/components/ContactMethod';
import SocialIcons from '@/features/landing/contact/components/SocialIcons';
import ContactForm from '@/features/landing/contact/components/ContactForm';
import Nav from '../layout/Nav';
import Footer from '../layout/Footer';

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* SECCIÓN 1 — Formas de contacto */}
      <section className="py-24 bg-gray-50/50">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-5xl font-extrabold text-[#04652c] mb-6">
              Formas de contacto
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Elige la opción que más te convenga para ponerte en contacto con nosotros. Nuestro equipo está listo para ayudarte.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card variant="default" className="h-[300px]">
              <ContactMethod
                icon={Mail}
                title="Correo Electrónico"
                description="Nuestro equipo está para atenderte."
                contact="sistemaspcg@gmail.com"
              />
            </Card>

            <Card variant="default" className="h-[300px]">
              <ContactMethod
                icon={MapPin}
                title="Punto Físico"
                description="Visítanos en nuestra oficina principal."
                contact="CC Monterrey"
              />
            </Card>

            <Card variant="default" className="h-[300px]">
              <ContactMethod
                icon={Phone}
                title="Teléfono"
                description="Lun-Vie de 8am a 6pm."
                contact="+57 313 685 0968"
              />
            </Card>
          </div>
        </Container>
      </section>

      {/* SECCIÓN 2 — Formulario "Contáctanos" */}
      <section className="py-24 bg-[#04652c] relative overflow-hidden">
        {/* Decoración de puntos */}
        <div className="absolute top-0 left-0 p-8 flex flex-wrap w-32 h-32 gap-2 opacity-20">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-white rounded-sm" />
          ))}
        </div>

        <Container>
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Columna Izquierda: Formulario */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl">
              <h3 className="text-3xl font-extrabold text-[#04652c] mb-8">
                Contáctanos
              </h3>
              <ContactForm />
            </div>

            {/* Columna Derecha: Decorativa */}
            <div className="text-white text-center flex flex-col items-center">
              <h2 className="text-5xl md:text-6xl font-black mb-12 leading-tight">
                ¡Déjanos un<br />correo electrónico!
              </h2>

              <div className="relative group">
                {/* Círculo verde medio */}
                <div className="w-56 h-56 bg-[#06a646] rounded-full flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-105 duration-500">
                  <Mail className="w-24 h-24 text-white" />
                </div>

                {/* Botón circular secundario con ícono de envío */}
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <SendHorizontal className="w-8 h-8 text-[#04652c]" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SECCIÓN 3 — Redes Sociales */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-800">
              Conoce nuestras redes sociales
            </h3>
          </div>
          <SocialIcons />
        </Container>
      </section>

      <Footer />
    </div>
  );
}