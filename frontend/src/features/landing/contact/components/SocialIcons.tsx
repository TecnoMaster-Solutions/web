import React from 'react';
import { Facebook, Instagram, MessageCircle, LucideIcon } from 'lucide-react';

// Interface para cada red social
interface SocialItem {
  icon: LucideIcon;
  href: string;
  label: string;
}

// Interface para las props del componente
interface SocialIconsProps {
  className?: string;
}

const SocialIcons: React.FC<SocialIconsProps> = ({ 
  className = "" 
}) => {
  // Array de redes sociales con sus respectivos iconos y enlaces
  const socials: SocialItem[] = [
    { 
      icon: Facebook, 
      href: 'https://facebook.com', 
      label: 'Facebook' 
    },
    { 
      icon: Instagram, 
      href: 'https://www.instagram.com/sistemas.pc/', 
      label: 'Instagram' 
    },
    { 
      icon: MessageCircle, 
      href: 'https://wa.me/573138976', 
      label: 'WhatsApp' 
    }
  ];

  return (
    <div className={`flex gap-4 justify-center ${className}`}>
      {socials.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-12 h-12 bg-gray-700 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
            aria-label={`Visitar nuestro ${social.label}`}
            title={social.label}
          >
            <Icon className="w-6 h-6 group-hover:scale-105 transition-transform duration-200" />
          </a>
        );
      })}
    </div>
  );
};

export default SocialIcons;