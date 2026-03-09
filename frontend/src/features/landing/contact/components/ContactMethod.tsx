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
    <div className={`text-center flex flex-col items-center ${className}`}>
      {/* Icon Container */}
      <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mb-6">
        <Icon className="w-7 h-7 text-[#04652c]" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold mb-3 text-gray-900">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-sm mb-4 max-w-[200px]">
        {description}
      </p>

      {/* Contact Information */}
      {contact && (
        <div className="mt-auto">
          <p className="text-[#04652c] font-bold text-base">
            {contact}
          </p>
        </div>
      )}
    </div>
  );
};

export default ContactMethod;