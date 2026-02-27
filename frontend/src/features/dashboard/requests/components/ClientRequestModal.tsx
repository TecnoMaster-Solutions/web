"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import type { Option } from "@/features/dashboard/requests/types/option.types";
import { showError, showInfo, showSuccess } from "@/shared/utils/notifications";
import { getServiceOptions } from "@/features/dashboard/requests/services/lookups.service";

export type CreateRequestPayload = {
  scheduledAt?: string | null;
  scheduledEndAt?: string | null;
  serviceType: string;
  description: string;
  direccion: string;
  stateId?: number;
  serviceId: number;
  clientId: number;
};

type ServiceOption = Option & {
  typeofserviceid?: number | null;
  typeofservicename?: string | null;
  serviceTypeCode?: string | null;
};

type ServiceTypeOption = {
  id: number;
  label: string;
  code: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRequestPayload) => void | Promise<void>;
  title?: string;
  servicios?: ServiceOption[] | null;
  clientId: number;
  clientLabel?: string;
  clientDocumentLabel?: string | null;
  initialServiceId?: number | null;
  initialDireccion?: string | null;
  initialAddressFields?: {
    city?: string | null;
    zone?: string | null;
    streetType?: string | null;
    streetNumber?: string | null;
    secondaryNumber?: string | null;
    complement?: string | null;
  } | null;
  onInitialAddressFieldsChange?: (next: {
    city: string;
    zone: string;
    streetType: string;
    streetNumber: string;
    secondaryNumber: string;
    complement: string;
  }) => void;
  addressOptions?: {
    cities?: string[];
    zones?: string[];
    streetTypes?: string[];
  } | null;
  pendingStateId?: number | null;
  scheduledStateId?: number | null;
};

type ErrorKey = "tipo" | "serviceId" | "description" | "direccion";
type Errors = Partial<Record<ErrorKey, string | null>>;
type Touched = Partial<Record<ErrorKey, boolean>>;

function getBackendMessage(err: unknown) {
  const anyErr = err as any;
  const msg = anyErr?.response?.data?.message ?? anyErr?.message ?? "";
  if (Array.isArray(msg)) return msg.filter(Boolean).join(" | ");
  return String(msg || "");
}

export default function ClientCreateRequestModal({
  isOpen,
  onClose,
  onSave,
  title = "Solicitar servicio",
  servicios,
  clientId,
  clientLabel,
  clientDocumentLabel,
  initialServiceId = null,
  initialDireccion,
  initialAddressFields,
  onInitialAddressFieldsChange,
  addressOptions,
  pendingStateId = null,
  scheduledStateId = null,
}: Props) {
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [direccion, setDireccion] = useState("");

  const [touched, setTouched] = useState<Touched>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [saving, setSaving] = useState(false);

  const [loadingLookups, setLoadingLookups] = useState(false);
  const [serviciosLocal, setServiciosLocal] = useState<ServiceOption[]>([]);

  const finalServicios = useMemo<ServiceOption[]>(() => {
    const fromProps = (
      Array.isArray(servicios) ? servicios : []
    ) as ServiceOption[];
    return fromProps.length ? fromProps : serviciosLocal;
  }, [servicios, serviciosLocal]);

  const serviceTypes = useMemo<ServiceTypeOption[]>(() => {
    const map = new Map<number, ServiceTypeOption>();

    (finalServicios || []).forEach((s) => {
      const typeId = s.typeofserviceid;
      const typeName = s.typeofservicename;
      if (!typeId || !typeName) return;
      if (map.has(typeId)) return;

      let code = (s.serviceTypeCode || "").trim();
      if (!code) {
        const norm = typeName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        if (norm.startsWith("mantenimiento")) code = "MANTENIMIENTO";
        else if (norm.startsWith("instal")) code = "INSTALACION";
        else code = typeName;
      }

      map.set(typeId, { id: typeId, label: typeName, code });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [finalServicios]);

  const selectedType = useMemo(
    () =>
      serviceTypeId
        ? serviceTypes.find((t) => t.id === serviceTypeId) || null
        : null,
    [serviceTypeId, serviceTypes]
  );

  const filteredServicios = useMemo<ServiceOption[]>(() => {
    const list = finalServicios || [];
    if (!serviceTypeId) return list;

    const hasTypeInfo = list.some((s) => s.typeofserviceid != null);
    if (!hasTypeInfo) return list;

    return list.filter((s) => s.typeofserviceid === serviceTypeId);
  }, [finalServicios, serviceTypeId]);

  function validateDireccion(v: string) {
    const dir = (v ?? "").trim();
    if (dir.length < 3) return "MÃ­nimo 3 caracteres.";
    if (dir.length > 255) return "MÃ¡ximo 255 caracteres.";
    return null;
  }

  function validateDescription(v: string) {
    const d = (v ?? "").trim();
    return d.length >= 3 ? null : "MÃ­nimo 3 caracteres.";
  }

  function validateServiceId(v: number | "") {
    return v !== "" ? null : "Selecciona un servicio.";
  }

  function validateTipo(id: number | null) {
    return id ? null : "Selecciona un tipo.";
  }

  const errors: Errors = useMemo(() => {
    const e: Errors = {};
    e.tipo = validateTipo(serviceTypeId);
    e.serviceId = validateServiceId(serviceId);
    e.description = validateDescription(description);
    e.direccion =
      initialAddressFields && onInitialAddressFieldsChange
        ? null
        : validateDireccion(direccion);
    return e;
  }, [
    serviceTypeId,
    serviceId,
    description,
    direccion,
    initialAddressFields,
    onInitialAddressFieldsChange,
  ]);

  function markTouched(k: ErrorKey) {
    setTouched((p) => ({ ...p, [k]: true }));
  }

  function shouldShowError(k: ErrorKey) {
    return !!submitAttempted || !!touched[k];
  }

  function resetForm() {
    setServiceTypeId(null);
    setServiceId("");
    setDescription("");
    setDireccion("");
    setTouched({});
    setSubmitAttempted(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    setTouched({});
    setSubmitAttempted(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialDireccion) return;

    setDireccion(initialDireccion);
  }, [isOpen, initialDireccion]);

  useEffect(() => {
    if (!isOpen) return;

    if (Array.isArray(servicios) && servicios.length) return;

    let cancel = false;

    (async () => {
      try {
        setLoadingLookups(true);
        const opts = await getServiceOptions();
        if (cancel) return;
        setServiciosLocal(Array.isArray(opts) ? (opts as any) : []);
      } catch {
        if (cancel) return;
        setServiciosLocal([]);
      } finally {
        if (cancel) return;
        setLoadingLookups(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [isOpen, servicios]);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialServiceId) return;
    if (!finalServicios.length) return;

    const found = finalServicios.find(
      (s: any) => Number(s?.id) === Number(initialServiceId)
    );
    if (!found) return;

    const sid = Number(found.id);
    if (Number.isFinite(sid) && sid > 0) setServiceId(sid as any);

    const tid = Number(found.typeofserviceid);
    if (Number.isFinite(tid) && tid > 0) setServiceTypeId(tid);
  }, [isOpen, initialServiceId, finalServicios]);

  async function submit() {
    setSubmitAttempted(true);

    if (initialAddressFields && onInitialAddressFieldsChange) {
      const city = String(initialAddressFields.city || "").trim();
      const zone = String(initialAddressFields.zone || "").trim();
      const streetType = String(initialAddressFields.streetType || "").trim();
      const streetNumber = String(initialAddressFields.streetNumber || "").trim();
      const secondaryNumber = String(
        initialAddressFields.secondaryNumber || ""
      ).trim();

      if (!city || !zone || !streetType || !streetNumber || !secondaryNumber) {
        showInfo("Completa los datos de direcciÃ³n.");
        return;
      }
    }

    const errKeys = Object.keys(errors) as ErrorKey[];
    const firstError = errKeys.find((k) => !!errors[k]);
    if (firstError) {
      showInfo("Revisa los campos marcados.");
      return;
    }

    if (!selectedType) {
      showInfo("Selecciona un tipo de servicio.");
      return;
    }

    const sid = Number(serviceId);
    if (!Number.isFinite(sid) || sid <= 0) {
      showInfo("Selecciona un servicio vÃ¡lido.");
      return;
    }

    try {
      setSaving(true);

      const composedDireccion =
        initialAddressFields && onInitialAddressFieldsChange
          ? `${String(initialAddressFields.streetType || "").trim()} ${String(
              initialAddressFields.streetNumber || ""
            ).trim()} #${String(
              initialAddressFields.secondaryNumber || ""
            ).trim()}, ${String(initialAddressFields.zone || "").trim()}, ${String(
              initialAddressFields.city || ""
            ).trim()}${
              String(initialAddressFields.complement || "").trim()
                ? ` (${String(initialAddressFields.complement || "").trim()})`
                : ""
            }`
          : String(direccion || "").trim();

      const basePayload: CreateRequestPayload = {
        scheduledAt: null,
        scheduledEndAt: null,
        serviceType: selectedType.code,
        description: String(description || "").trim(),
        direccion: composedDireccion,
        stateId: 0,
        serviceId: sid,
        clientId,
      };

      const hasProgrammedDate =
        (basePayload.scheduledAt && String(basePayload.scheduledAt).trim()) ||
        (basePayload.scheduledEndAt && String(basePayload.scheduledEndAt).trim());

      const stateIdToSend =
        (hasProgrammedDate &&
          scheduledStateId &&
          Number.isFinite(scheduledStateId) &&
          scheduledStateId > 0 &&
          scheduledStateId) ||
        (pendingStateId && Number.isFinite(pendingStateId) && pendingStateId > 0 && pendingStateId) ||
        5;

      const payload: CreateRequestPayload = {
        ...basePayload,
        stateId: stateIdToSend,
      };

      await onSave(payload);

      resetForm();
      onClose();
    } catch (err) {
      showError(getBackendMessage(err) || "No se pudo crear la solicitud.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-[#2a9781] px-3 py-2 text-sm font-semibold text-white hover:bg-[#227a69] disabled:opacity-60"
            disabled={saving || loadingLookups}
            title={loadingLookups ? "Cargando servicios..." : undefined}
          >
            {saving ? "Enviando..." : "Guardar"}
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        {clientLabel && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-[11px] font-medium text-gray-500">Cliente</p>
            <p className="text-sm font-semibold text-gray-900">{clientLabel}</p>
            {clientDocumentLabel && (
              <>
                <p className="mt-2 text-[11px] font-medium text-gray-500">
                  CÃ©dula
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {clientDocumentLabel}
                </p>
              </>
            )}
          </div>
        )}

        {initialAddressFields && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
            <p className="text-[11px] font-medium text-gray-500 mb-2">
              DirecciÃ³n de envÃ­o (carrito)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5">
                <p className="text-[10px] text-gray-500">Ciudad</p>
                <p className="text-xs font-medium text-gray-900">
                  {initialAddressFields.city || "-"}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5">
                <p className="text-[10px] text-gray-500">Zona / Barrio</p>
                <p className="text-xs font-medium text-gray-900">
                  {initialAddressFields.zone || "-"}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5">
                <p className="text-[10px] text-gray-500">Tipo de vÃ­a</p>
                <p className="text-xs font-medium text-gray-900">
                  {initialAddressFields.streetType || "-"}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5">
                <p className="text-[10px] text-gray-500">NÃºmero</p>
                <p className="text-xs font-medium text-gray-900">
                  {initialAddressFields.streetNumber || "-"}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5 md:col-span-2">
                <p className="text-[10px] text-gray-500"># secundaria</p>
                <p className="text-xs font-medium text-gray-900">
                  {initialAddressFields.secondaryNumber || "-"}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5 md:col-span-2">
                <p className="text-[10px] text-gray-500">Complemento</p>
                <p className="text-xs font-medium text-gray-900">
                  {initialAddressFields.complement || "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Tipo de servicio
            </h3>
            <span className="text-[11px] text-gray-500">
              {loadingLookups
                ? "Cargando tipos..."
                : serviceTypes.length
                ? "Selecciona uno"
                : "No hay tipos disponibles"}
            </span>
          </div>

          {serviceTypes.length ? (
            <div className="inline-grid grid-cols-2 gap-2">
              {serviceTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    markTouched("tipo");
                    setServiceTypeId(t.id);
                  }}
                  className={[
                    "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs border transition min-w-36",
                    serviceTypeId === t.id
                      ? "bg-black text-white border-black"
                      : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200",
                  ].join(" ")}
                  disabled={saving || loadingLookups}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              No hay tipos de servicio configurados por el administrador.
            </p>
          )}

          {shouldShowError("tipo") && errors.tipo && (
            <p className="mt-1 text-xs text-green-600">{errors.tipo}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">
              Servicio
            </label>
            <div className="relative">
              <select
                value={serviceId === "" ? "" : String(serviceId)}
                onChange={(e) => {
                  markTouched("serviceId");
                  const v = e.target.value ? Number(e.target.value) : "";
                  setServiceId(v);
                }}
                onBlur={() => markTouched("serviceId")}
                disabled={saving || loadingLookups}
                className={[
                  "w-full appearance-none rounded-lg border bg-gray-50 h-10 px-3 pr-8 text-sm focus:bg-white focus:ring-2 focus:ring-black/15 disabled:opacity-60",
                  shouldShowError("serviceId") && errors.serviceId
                    ? "border-green-500"
                    : "border-gray-300",
                ].join(" ")}
              >
                <option value="">
                  {loadingLookups
                    ? "Cargando servicios..."
                    : filteredServicios.length
                    ? "Selecciona el servicio"
                    : serviceTypeId
                    ? "No hay servicios para este tipo"
                    : "No hay servicios"}
                </option>
                {filteredServicios.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                â–¾
              </span>
            </div>

            {shouldShowError("serviceId") && errors.serviceId && (
              <p className="mt-1 text-xs text-green-600">{errors.serviceId}</p>
            )}
          </div>
        </div>

        {initialAddressFields && onInitialAddressFieldsChange && (
          <div className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-900">
              DirecciÃ³n de envÃ­o
            </p>

            <select
              value={String(initialAddressFields.city || "")}
              onChange={(e) =>
                onInitialAddressFieldsChange({
                  city: e.target.value,
                  zone: String(initialAddressFields.zone || ""),
                  streetType: String(initialAddressFields.streetType || ""),
                  streetNumber: String(initialAddressFields.streetNumber || ""),
                  secondaryNumber: String(initialAddressFields.secondaryNumber || ""),
                  complement: String(initialAddressFields.complement || ""),
                })
              }
              className="w-full rounded-lg border border-gray-300 bg-white h-10 px-3 text-sm"
              disabled={saving}
            >
              <option value="">Ciudad</option>
              {(addressOptions?.cities || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={String(initialAddressFields.zone || "")}
              onChange={(e) =>
                onInitialAddressFieldsChange({
                  city: String(initialAddressFields.city || ""),
                  zone: e.target.value,
                  streetType: String(initialAddressFields.streetType || ""),
                  streetNumber: String(initialAddressFields.streetNumber || ""),
                  secondaryNumber: String(initialAddressFields.secondaryNumber || ""),
                  complement: String(initialAddressFields.complement || ""),
                })
              }
              className="w-full rounded-lg border border-gray-300 bg-white h-10 px-3 text-sm"
              disabled={saving}
            >
              <option value="">Zona / Barrio</option>
              {(addressOptions?.zones || []).map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                value={String(initialAddressFields.streetType || "")}
                onChange={(e) =>
                  onInitialAddressFieldsChange({
                    city: String(initialAddressFields.city || ""),
                    zone: String(initialAddressFields.zone || ""),
                    streetType: e.target.value,
                    streetNumber: String(initialAddressFields.streetNumber || ""),
                    secondaryNumber: String(initialAddressFields.secondaryNumber || ""),
                    complement: String(initialAddressFields.complement || ""),
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white h-10 px-3 text-sm"
                disabled={saving}
              >
                <option value="">Tipo</option>
                {(addressOptions?.streetTypes || []).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <input
                value={String(initialAddressFields.streetNumber || "")}
                onChange={(e) =>
                  onInitialAddressFieldsChange({
                    city: String(initialAddressFields.city || ""),
                    zone: String(initialAddressFields.zone || ""),
                    streetType: String(initialAddressFields.streetType || ""),
                    streetNumber: e.target.value,
                    secondaryNumber: String(initialAddressFields.secondaryNumber || ""),
                    complement: String(initialAddressFields.complement || ""),
                  })
                }
                placeholder="NÃºmero"
                className="w-full rounded-lg border border-gray-300 bg-white h-10 px-3 text-sm"
                disabled={saving}
              />
            </div>

            <input
              value={String(initialAddressFields.secondaryNumber || "")}
              onChange={(e) =>
                onInitialAddressFieldsChange({
                  city: String(initialAddressFields.city || ""),
                  zone: String(initialAddressFields.zone || ""),
                  streetType: String(initialAddressFields.streetType || ""),
                  streetNumber: String(initialAddressFields.streetNumber || ""),
                  secondaryNumber: e.target.value,
                  complement: String(initialAddressFields.complement || ""),
                })
              }
              placeholder="# secundaria (ej: 23-18)"
              className="w-full rounded-lg border border-gray-300 bg-white h-10 px-3 text-sm"
              disabled={saving}
            />

            <input
              value={String(initialAddressFields.complement || "")}
              onChange={(e) =>
                onInitialAddressFieldsChange({
                  city: String(initialAddressFields.city || ""),
                  zone: String(initialAddressFields.zone || ""),
                  streetType: String(initialAddressFields.streetType || ""),
                  streetNumber: String(initialAddressFields.streetNumber || ""),
                  secondaryNumber: String(initialAddressFields.secondaryNumber || ""),
                  complement: e.target.value,
                })
              }
              placeholder="Complemento (Apto, Casa, Torre...)"
              className="w-full rounded-lg border border-gray-300 bg-white h-10 px-3 text-sm"
              disabled={saving}
            />
          </div>
        )}

        <div
          className={
            initialAddressFields && onInitialAddressFieldsChange
              ? "hidden"
              : "grid grid-cols-1 md:grid-cols-2 gap-3"
          }
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">
              DirecciÃ³n
            </label>
            <input
              value={direccion}
              onChange={(e) => {
                markTouched("direccion");
                setDireccion(e.target.value);
              }}
              onBlur={() => markTouched("direccion")}
              placeholder="Ej. Calle 123 #45-67"
              className={[
                "w-full rounded-lg border bg-gray-50 h-10 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-black/15",
                shouldShowError("direccion") && errors.direccion
                  ? "border-green-500"
                  : "border-gray-300",
              ].join(" ")}
            />
            {shouldShowError("direccion") && errors.direccion && (
              <p className="mt-1 text-xs text-green-600">{errors.direccion}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-900">
            DescripciÃ³n
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              markTouched("description");
              setDescription(e.target.value);
            }}
            onBlur={() => markTouched("description")}
            rows={3}
            className={[
              "w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-black/15",
              shouldShowError("description") && errors.description
                ? "border-green-500"
                : "border-gray-300",
            ].join(" ")}
          />
          {shouldShowError("description") && errors.description && (
            <p className="mt-1 text-xs text-green-600">{errors.description}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}


