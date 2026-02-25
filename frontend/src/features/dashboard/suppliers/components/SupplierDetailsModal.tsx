"use client";

import React from "react";
import {
  Star,
  Mail,
  Phone,
  BadgeCheck,
  BadgeX,
  Pencil,
  X,
  MapPin,
} from "lucide-react";
import Modal from "@/features/dashboard/components/Modal";

type Supplier = {
  id?: string | number;
  name: string;
  nit: string;
  phone: string;
  email: string;
  address: string;
  stateid: number | "";
  rating: number;
  contactName: string;
  status: "Activo" | "Inactivo";
  imageUrl?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onEdit?: (s: Supplier) => void;
  onToggleStatus?: (s: Supplier) => void | Promise<void>;
  title?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function toOneDecimal(n: number) {
  return Number(clamp(Number.isFinite(n) ? n : 0, 0, 5).toFixed(1));
}

function StatusBadge({ status }: { status: Supplier["status"] }) {
  const active = status === "Activo";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${
        active
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {active ? <BadgeCheck size={12} /> : <BadgeX size={12} />}
      {status}
    </span>
  );
}

function Stars({ value = 0 }: { value?: number }) {
  const v = toOneDecimal(value);
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = clamp(v - i, 0, 1);
        const pct = `${fill * 100}%`;
        return (
          <span key={i} className="relative inline-block h-[14px] w-[14px]">
            <Star className="h-[14px] w-[14px] text-gray-300" strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: pct }}>
              <Star
                className="h-[14px] w-[14px] text-yellow-500"
                strokeWidth={1.5}
                fill="currentColor"
              />
            </span>
          </span>
        );
      })}
      <span className="ml-1 text-[11px] text-gray-500">({v.toFixed(1)}/5.0)</span>
    </span>
  );
}

function Item({
  icon,
  label,
  value,
  className = "",
  valueClassName = "",
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`rounded-lg border bg-white px-3 py-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
        {icon}
        {label}
      </div>
      <div className={`mt-0.5 text-[13px] font-medium text-gray-800 ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}

export default function SupplierDetailsModal({
  isOpen,
  onClose,
  supplier,
  onEdit,
  onToggleStatus,
  title = "Detalles del Proveedor",
}: Props) {
  if (!supplier) return null;

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex w-full justify-end gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(supplier)}
              className="inline-flex items-center gap-2 rounded-md bg-black px-3 h-9 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              <Pencil size={16} />
              Editar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-md border px-3 h-9 text-sm bg-white hover:bg-gray-50"
          >
            <X size={16} />
            Cerrar
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-5">
        <aside className="space-y-3">
          <div className="overflow-hidden rounded-xl border bg-white flex items-center justify-center p-2">
            {supplier.imageUrl ? (
              <img
                src={supplier.imageUrl}
                alt={supplier.name}
                className="max-h-[150px] w-auto object-contain"
              />
            ) : (
              <div className="h-[150px] w-full flex items-center justify-center text-gray-400 text-xs">
                Sin imagen
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={supplier.status} />
            <Stars value={supplier.rating} />
          </div>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {supplier.name}
            </h3>
            <div className="text-[13px] text-gray-500">
              Contacto:{" "}
              <span className="font-medium text-gray-800">
                {supplier.contactName || "—"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Item
              label="NIT"
              value={<span className="font-mono">{supplier.nit || "—"}</span>}
              valueClassName="truncate"
            />

            <Item
              icon={<Phone size={14} />}
              label="Teléfono"
              value={
                supplier.phone ? (
                  <a
                    href={`tel:${supplier.phone.replace(/\s+/g, "")}`}
                    className="hover:underline"
                  >
                    {supplier.phone}
                  </a>
                ) : (
                  "—"
                )
              }
              valueClassName="truncate"
            />

            <Item
              icon={<Mail size={14} />}
              label="Correo"
              className="sm:col-span-2"
              value={
                supplier.email ? (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="hover:underline break-all whitespace-normal"
                  >
                    {supplier.email}
                  </a>
                ) : (
                  "—"
                )
              }
              valueClassName="break-all whitespace-normal"
            />

            <Item
              icon={<MapPin size={14} />}
              label="Dirección"
              className="sm:col-span-2"
              value={supplier.address || "—"}
              valueClassName="break-words whitespace-normal"
            />
          </div>
        </section>
      </div>
    </Modal>
  );
}
