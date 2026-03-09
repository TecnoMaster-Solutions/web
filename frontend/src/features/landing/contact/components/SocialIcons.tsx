import { Facebook, Instagram, Twitter, LucideIcon } from 'lucide-react';

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
      icon: Instagram,
      href: 'https://instagram.com',
      label: 'Instagram'
    },
    {
      icon: Facebook,
      href: 'https://facebook.com',
      label: 'Facebook'
    },
    {
      icon: Twitter,
      href: 'https://twitter.com',
      label: 'Twitter'
    }
  ];

  return (
    <div className={`flex gap-6 justify-center ${className}`}>
      {socials.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm text-[#04652c] transition-all duration-300 hover:text-[#06a646] hover:shadow-md transform hover:-translate-y-1"
            aria-label={`Visitar nuestro ${social.label}`}
            title={social.label}
          >
            <Icon className="w-6 h-6" />
          </a>
        );
      })}
    </div>
  );
};

export default SocialIcons;