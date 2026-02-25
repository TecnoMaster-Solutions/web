import React from 'react';

// Interface para las props del componente
interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ 
  title, 
  subtitle, 
  className = "" 
}) => {
  return (
    <div className={`text-center ${className}`}>
      {/* Main Title */}
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      
      {/* Decorative Line */}
      <div className="w-20 h-1 bg-red-600 mx-auto mb-4 rounded-full"></div>
      
      {/* Subtitle (Optional) */}
      {subtitle && (
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;