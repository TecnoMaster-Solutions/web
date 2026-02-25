interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function SectionTitle({ title, subtitle, className = "" }: SectionTitleProps) {
  return (
    <div className={`text-center ${className}`}>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      <div className="w-20 h-1 bg-rojo-primario mx-auto mb-4 rounded-full"></div>
      {subtitle && (
        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}