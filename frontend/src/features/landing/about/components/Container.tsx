import React from 'react';

// Definir la interfaz para las props
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

// Opción 1: Con interfaz (recomendado)
const Container: React.FC<ContainerProps> = ({ children, className = "" }) => {
  return (
    <div className={`container mx-auto px-4 ${className}`}>
      {children}
    </div>
  );
};

// Opción 2: Sin interfaz (más simple)
// const Container = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
//   return (
//     <div className={`container mx-auto px-4 ${className}`}>
//       {children}
//     </div>
//   );
// };

export default Container;