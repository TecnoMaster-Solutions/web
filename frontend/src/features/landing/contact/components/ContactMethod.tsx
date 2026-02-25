import React from 'react';
import { LucideIcon } from 'lucide-react';

// Interface para las props del componente
interface ContactMethodProps {
  icon: LucideIcon;
  title: string;
  description: string;
  contact?: string;
  className?: string;
}

const ContactMethod: React.FC<ContactMethodProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  contact,
  className = "" 
}) => {
  return (
    <div className={`text-center ${className}`}>
      {/* Icon Container */}
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-red-100 transition-colors duration-200">
        <Icon className="w-8 h-8 text-red-600" />
      </div>
      
      {/* Title */}
      <h3 className="text-xl font-semibold mb-2 text-gray-900">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 text-sm mb-3">
        {description}
      </p>
      
      {/* Contact Information */}
      {contact && (
        <div className="mt-2">
          <p className="text-red-600 font-medium text-sm hover:text-red-700 transition-colors duration-200">
            {contact}
          </p>
        </div>
      )}
    </div>
  );
};

export default ContactMethod;