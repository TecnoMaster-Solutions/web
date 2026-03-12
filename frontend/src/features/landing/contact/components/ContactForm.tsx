
import React, { useState, FormEvent } from 'react';
import { User, Mail, MessageSquare, Send } from 'lucide-react';
import { showSuccess, showError } from '@/shared/utils/notifications';
import { getPublicRuntimeConfig } from '@/lib/runtime-config';

interface ContactFormData {
  nombre: string;
  email: string;
  mensaje: string;
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    nombre: '',
    email: '',
    mensaje: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiUrl = getPublicRuntimeConfig().apiUrl;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.nombre || !formData.email || !formData.mensaje) {
      showError('Todos los campos son obligatorios');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess(data.message || '¡Mensaje enviado! Te responderemos pronto.');
        setFormData({ nombre: '', email: '', mensaje: '' });
      } else {
        showError(data.error || 'Hubo un problema al enviar. Intenta nuevamente.');
      }
    } catch (error) {
      showError('Hubo un problema al enviar. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative">
        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleInputChange}
          placeholder="Nombre completo"
          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#04652c] transition-all outline-none text-gray-700"
          required
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Correo Electrónico"
          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#04652c] transition-all outline-none text-gray-700"
          required
        />
      </div>

      <div className="relative">
        <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
        <textarea
          name="mensaje"
          value={formData.mensaje}
          onChange={handleInputChange}
          placeholder="¿En qué podemos ayudarte?"
          rows={5}
          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#04652c] transition-all outline-none text-gray-700 resize-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto px-8 py-4 bg-[#04652c] hover:bg-[#06a646] text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
        {!isSubmitting && <Send className="w-4 h-4" />}
      </button>
    </form>
  );
};

export default ContactForm;
