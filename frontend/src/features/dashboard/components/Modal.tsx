"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ModalProps = {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string; 
};

export default function Modal({
  title,
  isOpen,
  onClose,
  children,
  footer,
  widthClass = "md:max-w-lg", //  por defecto, igual a antes
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`
              bg-white rounded-2xl shadow-lg
              w-full sm:w-[90%] ${widthClass}
              max-h-[90vh] flex flex-col
            `}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-base sm:text-lg font-semibold truncate pr-2">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="cursor-pointer text-gray-500 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content con scroll si se desborda */}
            <div className="p-4 overflow-y-auto flex-1">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 border-t">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
