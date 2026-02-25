import { motion } from "framer-motion";
export function OptimizedTdComponent({
  children,
  className = "",
  colIndex = 0,
  header,
  width,
}: {
  children: React.ReactNode;
  className?: string;
  colIndex?: number;
  header: string;
  width?: string;
}) {
  return (
    <motion.td
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: colIndex * 0.1 }}
      className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${className}`}
      style={{ width }}
      data-label={header}
    >
      {children}
    </motion.td>
  );
}
