import React from 'react';
import { cn } from '@/lib/utils';

// Definir los tipos de variantes disponibles
type CardVariant = 'default' | 'elevated' | 'bordered';

// Interface para las props del componente
interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}

// Definir las variantes de estilos
const cardVariants: Record<CardVariant, string> = {
  default: "card",
  elevated: "card shadow-lg hover:shadow-xl transition-shadow duration-200",
  bordered: "bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-red-600 transition-colors duration-200"
};

const Card: React.FC<CardProps> = ({ 
  children, 
  variant = "default", 
  className = "" 
}) => {
  return (
    <div className={cn(cardVariants[variant], className)}>
      {children}
    </div>
  );
};

export default Card;