'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type AccordionItem = {
  question: string;
  answer: string;
};

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-[20px] overflow-hidden border border-gray-100 shadow-sm"
        >
          {/* Botón de la pregunta */}
          <button
            onClick={() => toggleItem(index)}
            className={`w-full flex justify-between items-center text-left px-8 py-6 transition-all duration-300 focus:outline-none ${openIndex === index
                ? 'bg-[#04652c] text-white'
                : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
          >
            <h3 className="text-lg font-bold">
              {item.question}
            </h3>
            {openIndex === index ? (
              <ChevronUp className="w-6 h-6 text-white" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            )}
          </button>

          {/* Contenido expandible */}
          <div
            className={`transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="bg-white px-8 py-6 border-t border-gray-50">
              <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                {item.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}