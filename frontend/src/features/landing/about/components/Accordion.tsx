'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type AccordionItem = {
  question: string;
  answer: string;
};

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Primera pregunta abierta por defecto

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index}>
          {/* Botón de la pregunta */}
          <button
            onClick={() => toggleItem(index)}
            className={`w-full flex justify-between items-center text-left px-6 py-4 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              openIndex === index 
                ? 'bg-white border-2 border-gray-800 text-gray-800 focus:ring-gray-800' 
                : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-600'
            }`}
            aria-expanded={openIndex === index}
            aria-controls={`accordion-content-${index}`}
          >
            <h3 className="text-lg font-medium">
              {item.question}
            </h3>
            <ChevronDown 
              className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ml-4 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          {/* Contenido expandible */}
          <div
            id={`accordion-content-${index}`}
            className={`overflow-hidden transition-all duration-300 ${
              openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {openIndex === index && (
              <div className="px-6 py-4 mt-2 bg-gray-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}