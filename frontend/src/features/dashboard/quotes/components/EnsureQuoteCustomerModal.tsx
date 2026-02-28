"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import { getCustomersForQuote } from "../api/quotes.api";
import { showError, showSuccess } from "@/shared/utils/notifications";

export type NewClientForm = {
  tipo: string;
  documento: string;
  nombre: string;
  apellido?: string;
  telefono: string;
  correo: string;
};

type CustomerOption = {
  id: number;
  label: string;
  document?: string;
};

type Props = {
  isOpen: boolean;
  quoteId: number | null;
  onClose: () => void;
  onSuccess: () => void;
  onAssignExisting: (customerId: number) => Promise<void>;
  onCreateAndAssign: (form: NewClientForm) => Promise<void>;
};

const normalizeText = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toPositiveId = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const responseMsg = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
    if (Array.isArray(responseMsg)) return responseMsg.filter(Boolean).join(", ");
    if (typeof responseMsg === "string" && responseMsg.trim()) return responseMsg;
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
};

function mapCustomers(raw: unknown): CustomerOption[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown[] })?.data)
      ? ((raw as { data?: unknown[] }).data as unknown[])
      : [];

  return list
    .map((entry) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      const id = toPositiveId(item.customerid ?? item.id);
      if (!id) return null;

      const user = ((item.users ?? item.user ?? {}) as Record<string, unknown>);
      const first = String(user?.name ?? item?.name ?? "").trim();
      const last = String(user?.lastname ?? item?.lastname ?? "").trim();
      const fullName = [first, last].filter(Boolean).join(" ").trim();
      const document = String(
        user?.documentnumber ??
          user?.documentNumber ??
          item?.documentnumber ??
          item?.documentNumber ??
          "",
      ).trim();

      return {
        id,
        label: fullName || `Cliente #${id}`,
        document: document || undefined,
      } as CustomerOption;
    })
    .filter((x): x is CustomerOption => Boolean(x))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default function EnsureQuoteCustomerModal({
  isOpen,
  quoteId,
  onClose,
  onSuccess,
  onAssignExisting,
  onCreateAndAssign,
}: Props) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const [form, setForm] = useState<NewClientForm>({
    tipo: "CC",
    documento: "",
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    setMode("existing");
    setSearch("");
    setSelectedCustomerId(null);
    setForm({
      tipo: "CC",
      documento: "",
      nombre: "",
      apellido: "",
      telefono: "",
      correo: "",
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoadingCustomers(true);

    (async () => {
      try {
        const data = await getCustomersForQuote();
        if (cancelled) return;
        setCustomers(mapCustomers(data));
      } catch (error: unknown) {
        if (cancelled) return;
        setCustomers([]);
        showError(getErrorMessage(error, "No se pudieron cargar los clientes."));
      } finally {
        if (!cancelled) setLoadingCustomers(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const filteredCustomers = useMemo(() => {
    const term = normalizeText(search);
    if (!term) return customers;

    return customers.filter((customer) => {
      const name = normalizeText(customer.label);
      const doc = normalizeText(customer.document ?? "");
      return name.includes(term) || doc.includes(term);
    });
  }, [customers, search]);

  const handleConfirm = async () => {
    if (!quoteId) return;

    if (mode === "existing") {
      if (!selectedCustomerId) {
        showError("Selecciona un cliente existente.");
        return;
      }

      setSubmitting(true);
      try {
        await onAssignExisting(selectedCustomerId);
        showSuccess("Cliente asociado correctamente.");
        onSuccess();
      } catch (error: unknown) {
        showError(getErrorMessage(error, "No se pudo asociar el cliente."));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const requiredValues = [form.tipo, form.documento, form.nombre, form.telefono, form.correo];
    if (requiredValues.some((value) => !String(value ?? "").trim())) {
      showError("Documento, nombre, teléfono y correo son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      await onCreateAndAssign(form);
      showSuccess("Cliente creado y asociado correctamente.");
      onSuccess();
    } catch (error: unknown) {
      showError(getErrorMessage(error, "No se pudo crear/asociar el cliente."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => undefined : onClose}
      title="Asignar cliente a cotización"
      widthClass="md:max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !quoteId}
            className="px-4 py-2 rounded-md bg-[#b20000] text-white hover:bg-[#910000] disabled:opacity-60"
          >
            {submitting
              ? "Guardando..."
              : mode === "existing"
                ? "Asociar cliente"
                : "Crear y asociar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              mode === "existing"
                ? "bg-[#b20000] text-white border-[#b20000]"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            Cliente existente
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              mode === "new"
                ? "bg-[#b20000] text-white border-[#b20000]"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            Crear cliente
          </button>
        </div>

        {mode === "existing" ? (
          <div className="space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o documento"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b20000]/30"
            />

            <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200">
              {loadingCustomers ? (
                <div className="p-3 text-sm text-gray-500">Cargando clientes...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No hay clientes para mostrar.</div>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 ${
                      selectedCustomerId === customer.id ? "bg-red-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{customer.label}</div>
                    <div className="text-xs text-gray-500">
                      {customer.document ? `Documento: ${customer.document}` : "Sin documento"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              Tipo de documento
              <select
                value={form.tipo}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="CC">CC</option>
                <option value="TI">TI</option>
                <option value="CE">CE</option>
                <option value="NIT">NIT</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Documento
              <input
                value={form.documento}
                onChange={(e) => setForm((prev) => ({ ...prev, documento: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-gray-700">
              Nombre
              <input
                value={form.nombre}
                onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-gray-700">
              Apellido (opcional)
              <input
                value={form.apellido ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, apellido: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-gray-700">
              Teléfono
              <input
                value={form.telefono}
                onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-gray-700">
              Correo
              <input
                type="email"
                value={form.correo}
                onChange={(e) => setForm((prev) => ({ ...prev, correo: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
}
