import React from 'react';
import { cn } from '@/features/landing/about/lib/utils';

// Definir los tipos de variantes
type CardVariant = 'default' | 'elevated' | 'bordered' | 'pillar';

// Interfaz para las props
interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  variant = "default", 
  className = "" 
}) => {
  const variants: Record<CardVariant, string> = {
    default: "bg-white rounded-lg p-6 shadow-sm",
    elevated: "bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300",
    bordered: "bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-gray-400 transition-colors duration-200",
    pillar: "bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center"
  };

  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
};

export default Card;