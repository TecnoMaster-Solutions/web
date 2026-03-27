"use client";

import { useEffect, useState } from "react";
import { helpModules } from "@/shared/data/helpData";

export default function FloatingHelpButton() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(helpModules[0]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        type="button"
        aria-label="Abrir ayuda virtual"
        title="Ayuda"
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-[#04652c] text-2xl font-bold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95"
      >
        ?
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[2px]">
          <div className="flex h-full w-full items-center justify-center p-4 md:p-6">
            <div className="relative flex h-[92vh] w-[98vw] max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <button
                onClick={() => setOpen(false)}
                type="button"
                className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-xl text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-black"
                aria-label="Cerrar ayuda"
                title="Cerrar"
              >
                ×
              </button>

              <aside className="flex w-[290px] shrink-0 flex-col border-r border-gray-200 bg-[#f8faf8]">
                <div className="border-b border-gray-200 px-5 py-5">
                  <h2 className="text-xl font-bold text-gray-900">
                    Ayuda virtual
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecciona un módulo para ver su tutorial.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {helpModules.map((module) => {
                      const isActive = selected.id === module.id;

                      return (
                        <button
                          key={module.id}
                          onClick={() => setSelected(module)}
                          type="button"
                          className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                            isActive
                              ? "bg-[#04652c] text-white shadow-md"
                              : "bg-white text-gray-700 border border-gray-200 hover:border-[#04652c]/30 hover:bg-[#04652c]/5"
                          }`}
                        >
                          {module.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="flex min-w-0 flex-1 flex-col bg-white">
                <div className="border-b border-gray-200 px-6 py-5 md:px-8">
                  <h3 className="mt-1 text-3xl font-bold text-gray-900">
                    {selected.name}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">
                    {selected.description}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
                  <div className="space-y-6">
                    {selected.tutorials.map((tut, i) => (
                      <article
                        key={i}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
                      >
                        <div className="mb-5">
                          <h4 className="text-2xl font-semibold text-gray-900">
                            {tut.title}
                          </h4>
                          <p className="mt-2 text-sm text-gray-600 md:text-base">
                            {tut.description}
                          </p>
                        </div>

                        <div className="mb-6 rounded-2xl bg-[#f6faf7] p-4 md:p-5">
                          <h5 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#04652c]">
                            Paso a paso
                          </h5>

                          <ol className="space-y-3">
                            {tut.steps.map((step, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#04652c] text-sm font-bold text-white">
                                  {index + 1}
                                </span>
                                <span className="text-sm text-gray-700 md:text-base">
                                  {step}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black">
                          <div className="aspect-video w-full">
                            <iframe
                              src={tut.videoUrl}
                              title={tut.title}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}