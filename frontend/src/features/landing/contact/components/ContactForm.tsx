
import React, { useState, FormEvent } from 'react';
import { Send, User, Mail, MessageSquare } from 'lucide-react';

interface ContactFormData {
  nombre: string;
  email: string;
  mensaje: string;
}

interface ContactFormProps {
  className?: string;
  onSubmit?: (data: ContactFormData) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ 
  className = '', 
  onSubmit 
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    nombre: '',
    email: '',
    mensaje: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!formData.mensaje.trim()) {
      newErrors.mensaje = 'El mensaje es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSubmit) {
        onSubmit(formData);
      } else {
        console.log('Form submitted:', formData);
        alert('¡Mensaje enviado correctamente!');
      }
      
      // Reset form
      setFormData({
        nombre: '',
        email: '',
        mensaje: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error al enviar el mensaje. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Contáctanos
        </h3>
        <p className="text-gray-600 text-sm">
          Completa el formulario y te responderemos pronto
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre Field */}
        <div className="space-y-2">
          <label 
            htmlFor="nombre" 
            className="block text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <User className="w-4 h-4 text-gray-500" />
            Nombre
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Ingresa tu nombre completo"
            className={`
              w-full px-4 py-3 border rounded-lg 
              focus:ring-2 focus:ring-red-500 focus:border-red-500 
              transition-colors duration-200
              ${errors.nombre 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 bg-gray-50 focus:bg-white'
              }
            `}
            disabled={isSubmitting}
          />
          {errors.nombre && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              {errors.nombre}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <Mail className="w-4 h-4 text-gray-500" />
            Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="correo@ejemplo.com"
            className={`
              w-full px-4 py-3 border rounded-lg 
              focus:ring-2 focus:ring-red-500 focus:border-red-500 
              transition-colors duration-200
              ${errors.email 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 bg-gray-50 focus:bg-white'
              }
            `}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Mensaje Field */}
        <div className="space-y-2">
          <label 
            htmlFor="mensaje" 
            className="block text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-gray-500" />
            Mensaje
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            rows={4}
            value={formData.mensaje}
            onChange={handleInputChange}
            placeholder="Escribe tu mensaje aquí..."
            className={`
              w-full px-4 py-3 border rounded-lg resize-none
              focus:ring-2 focus:ring-red-500 focus:border-red-500 
              transition-colors duration-200
              ${errors.mensaje 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 bg-gray-50 focus:bg-white'
              }
            `}
            disabled={isSubmitting}
          />
          {errors.mensaje && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              {errors.mensaje}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full py-3 px-6 rounded-lg font-medium text-white
              flex items-center justify-center gap-2
              transition-all duration-200
              ${isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 active:bg-red-800 hover:shadow-lg'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar
              </>
            )}
          </button>
        </div>
      </form>

      {/* Additional Info */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          Al enviar este formulario, aceptas que procesemos tus datos para responderte. 
          <br />
          Respuesta típica en 24 horas durante días laborables.
        </p>
      </div>
    </div>
  );
};

export default ContactForm;