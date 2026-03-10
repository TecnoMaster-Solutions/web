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
  default: "bg-white rounded-xl shadow-sm border border-gray-100 p-6",
  elevated: "bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-8",
  bordered: "bg-white rounded-xl border border-gray-200 p-6 hover:border-[#04652c] transition-colors duration-200"
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