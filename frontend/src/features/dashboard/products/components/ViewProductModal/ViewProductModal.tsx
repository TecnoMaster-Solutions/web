"use client";

import React, { useMemo, useState, useEffect } from "react";
import Modal from "@/features/dashboard/components/Modal";
import Colors from "@/shared/theme/colors";
import { Product } from "@/features/dashboard/products/types/typesProducts";

interface ViewProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

const cleanText = (v: unknown) => {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  const lower = s.toLowerCase();
  if (lower === "null" || lower === "undefined") return "—";
  return s;
};

const moneyCO = (v: unknown) => {
  const n =
    typeof v === "number"
      ? v
      : Number(String(v ?? "").replace(/\./g, "").trim());
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("es-CO")}`;
};

const ViewProductModal: React.FC<ViewProductModalProps> = ({
  isOpen,
  product,
  onClose,
}) => {
  const images = useMemo(() => {
    if (!product) return [] as string[];

    const arr = Array.isArray((product as any).images)
      ? ((product as any).images as string[])
      : [];
    const single = product.image ? [product.image] : [];
    const base = arr.length ? arr : single;

    const seen = new Set<string>();
    return base
      .map((x) => String(x ?? "").trim())
      .filter((x) => x)
      .filter((x) => {
        if (seen.has(x)) return false;
        seen.add(x);
        return true;
      })
      .slice(0, 6);
  }, [product]);

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (isOpen) setActiveIdx(0);
  }, [isOpen, product?.id]);

  if (!product) return null;

  const activeUrl = images[activeIdx] ?? images[0] ?? "";

  const Field = ({
    label,
    value,
    span = "",
    monospace = false,
  }: {
    label: string;
    value: React.ReactNode;
    span?: string;
    monospace?: boolean;
  }) => (
    <div className={span}>
      <label
        className="block text-sm font-medium mb-1"
        style={{ color: Colors.texts.primary }}
      >
        {label}
      </label>
      <div
        className={[
          "px-3 py-2 border rounded-md bg-gray-50 text-sm break-words",
          monospace ? "tabular-nums" : "",
        ].join(" ")}
        style={{ borderColor: Colors.table.lines }}
      >
        {value}
      </div>
    </div>
  );

  return (
    <Modal
      title="Detalle del Producto"
      isOpen={isOpen}
      onClose={onClose}
      widthClass="md:max-w-5xl"
      footer={
        <div className="flex justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="min-h-0" style={{ maxHeight: "70vh" }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-1 min-h-0">
          {/* IZQUIERDA */}
          <div className="lg:col-span-2 min-h-0">
            {/* 3 campos por fila (desde md en adelante) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field
                label="Nombre"
                value={cleanText(product.name)}
                span="md:col-span-3"
              />

              {/* MISMA FILA (3 campos): Categoría / Categoría del proveedor / Código */}
              <Field label="Categoría" value={cleanText(product.categoryName)} />
              <Field
                label="Categoría del proveedor"
                value={cleanText(product.supplierCategory)}
              />
              <Field label="Código" value={cleanText(product.code)} />

              {/* SIGUIENTE FILA (3 campos): Stock / Precio proveedor / Precio venta */}
              <Field
                label="Stock"
                value={
                  Number.isFinite(Number(product.stock))
                    ? Number(product.stock)
                    : "—"
                }
                monospace
              />
              <Field
                label="Precio proveedor"
                value={moneyCO(product.supplierPrice)}
                monospace
              />
              <Field
                label="Precio venta"
                value={moneyCO(product.salePrice)}
                monospace
              />

              {/* DESCRIPCIÓN: a la izquierda, ancha, y más baja para evitar scroll del modal */}
              <div className="md:col-span-3 min-h-0">
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: Colors.texts.primary }}
                >
                  Descripción
                </label>
                <div
                  className="px-3 py-2 border rounded-md bg-gray-50 text-sm whitespace-pre-line break-words min-h-0"
                  style={{
                    borderColor: Colors.table.lines,
                    minHeight: 130,
                    maxHeight: 160,
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                >
                  {cleanText(product.description) === "—"
                    ? "Sin descripción"
                    : cleanText(product.description)}
                </div>
              </div>
            </div>
          </div>

          {/* DERECHA */}
          <div className="lg:col-span-1 min-h-0 flex flex-col gap-3">
            {/* IMÁGENES */}
            <div
              className="rounded-md border bg-white overflow-hidden"
              style={{ borderColor: Colors.table.lines }}
            >
              <div
                className="px-3 py-3 border-b bg-gray-50"
                style={{ borderColor: Colors.table.lines }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: Colors.texts.primary }}
                    >
                      Imágenes
                    </div>
                    <div className="text-xs text-gray-600 leading-4 mt-1">
                      PNG, JPG, WEBP · Máximo 6 imágenes
                      <div className="mt-1">
                        La primera imagen es la principal.
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-gray-500 font-medium">
                    {images.length}/6
                  </span>
                </div>
              </div>

              <div className="p-3">
                <div
                  className="rounded-md border bg-gray-50 overflow-hidden flex items-center justify-center"
                  style={{ borderColor: Colors.table.lines, height: 160 }}
                >
                  {activeUrl ? (
                    <img
                      src={activeUrl}
                      alt="principal"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">Sin imágenes</div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {images.map((url, idx) => (
                      <button
                        key={`${url}-${idx}`}
                        type="button"
                        onClick={() => setActiveIdx(idx)}
                        className={[
                          "shrink-0 rounded-md border overflow-hidden bg-white",
                          idx === activeIdx
                            ? "ring-2 ring-black"
                            : "hover:ring-2 hover:ring-gray-300",
                        ].join(" ")}
                        style={{
                          borderColor: Colors.table.lines,
                          width: 52,
                          height: 52,
                        }}
                        title={idx === 0 ? "Principal" : "Ver imagen"}
                      >
                        <img
                          src={url}
                          alt={`thumb-${idx}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Field label="Estado" value={cleanText(product.state)} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ViewProductModal;