"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import type { Option } from "@/features/dashboard/requests/types/option.types";
import { showError, showInfo } from "@/shared/utils/notifications";
import { getServiceOptions } from "@/features/dashboard/requests/services/lookups.service";
import { hasInvalidRequestCharacters } from "@/features/dashboard/requests/utils/textValidation";

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
};

type ErrorKey = "tipo" | "serviceId" | "description" | "direccion";
type Errors = Partial<Record<ErrorKey, string | null>>;
type Touched = Partial<Record<ErrorKey, boolean>>;

type ApiErrorShape = {
  message?: string;
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

function getBackendMessage(err: unknown) {
  const anyErr = err as ApiErrorShape;
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
  pendingStateId = null,
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

  const selectedService = useMemo(
    () =>
      serviceId !== ""
        ? filteredServicios.find((s) => Number(s.id) === Number(serviceId)) || null
        : null,
    [filteredServicios, serviceId]
  );

  function validateDireccion(v: string) {
    const dir = (v ?? "").trim();
    if (dir.length < 3) return "Minimo 3 caracteres.";
    if (dir.length > 255) return "Maximo 255 caracteres.";
    if (hasInvalidRequestCharacters(dir)) return "Contiene caracteres no permitidos.";
    return null;
  }

  function validateDescription(v: string) {
    const d = (v ?? "").trim();
    if (d.length < 3) return "Minimo 3 caracteres.";
    if (hasInvalidRequestCharacters(d)) return "Contiene caracteres no permitidos.";
    return null;
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
        setServiciosLocal(Array.isArray(opts) ? opts : []);
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
      (s) => Number(s?.id) === Number(initialServiceId)
    );
    if (!found) return;

    const sid = Number(found.id);
    if (Number.isFinite(sid) && sid > 0) setServiceId(sid);

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
        showInfo("Completa los datos de direccion.");
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
      showInfo("Selecciona un servicio valido.");
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

      const fromPayloadState = Number(basePayload.stateId);
      const stateIdToSend =
        (Number.isFinite(fromPayloadState) &&
          fromPayloadState > 0 &&
          fromPayloadState) ||
        (pendingStateId &&
          Number.isFinite(pendingStateId) &&
          pendingStateId > 0 &&
          pendingStateId) ||
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

  const fieldLabelClass =
    "mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";
  const inputBaseClass =
    "w-full rounded-2xl border bg-white px-4 text-sm text-slate-900 shadow-sm transition outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      widthClass="md:max-w-5xl"
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            disabled={saving || loadingLookups}
            title={loadingLookups ? "Cargando servicios..." : undefined}
          >
            {saving ? "Enviando..." : "Guardar"}
          </button>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Resumen
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              Agenda una visita de soporte
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Completa los datos principales y deja claro que necesitas para
              que el equipo prepare la atencion.
            </p>

            <div className="mt-5 space-y-3">
              {clientLabel && (
                <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Cliente
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {clientLabel}
                  </p>
                  {clientDocumentLabel && (
                    <p className="mt-1 text-sm text-slate-600">
                      {clientDocumentLabel}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-white/80 bg-slate-900 p-4 text-white shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Seleccion actual
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedType?.label || "Elige un tipo de servicio"}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {selectedService?.label ||
                    "Luego selecciona el servicio especifico"}
                </p>
              </div>
            </div>
          </div>

          {initialAddressFields && (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Direccion del carrito
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                    Ciudad
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {initialAddressFields.city || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                    Zona
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {initialAddressFields.zone || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                    Tipo de via
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {initialAddressFields.streetType || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                    Numero
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {initialAddressFields.streetNumber || "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>

        <div className="space-y-4">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Paso 1
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  Tipo y servicio
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {loadingLookups
                  ? "Cargando tipos..."
                  : serviceTypes.length
                    ? "Selecciona una opcion"
                    : "No hay tipos disponibles"}
              </span>
            </div>

            <div className="mt-4 space-y-5">
              <div>
                <label className={fieldLabelClass}>Tipo de servicio</label>
                {serviceTypes.length ? (
                  <div className="flex flex-wrap gap-2.5">
                    {serviceTypes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          markTouched("tipo");
                          setServiceTypeId(t.id);
                        }}
                        className={[
                          "inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium transition",
                          serviceTypeId === t.id
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50",
                        ].join(" ")}
                        disabled={saving || loadingLookups}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No hay tipos de servicio configurados por el administrador.
                  </p>
                )}
                {shouldShowError("tipo") && errors.tipo && (
                  <p className="mt-2 text-xs text-red-600">{errors.tipo}</p>
                )}
              </div>

              <div>
                <label className={fieldLabelClass}>Servicio</label>
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
                      inputBaseClass,
                      "h-12 appearance-none pr-10",
                      shouldShowError("serviceId") && errors.serviceId
                        ? "border-red-500"
                        : "border-slate-200",
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
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    ▼
                  </span>
                </div>
                {shouldShowError("serviceId") && errors.serviceId && (
                  <p className="mt-2 text-xs text-red-600">{errors.serviceId}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Paso 2
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                Datos de atencion
              </h3>
            </div>

            <div className="mt-4 space-y-4">
              {initialAddressFields && onInitialAddressFieldsChange ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={fieldLabelClass}>Ciudad</label>
                    <input
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
                      placeholder="Ciudad"
                      className={`${inputBaseClass} h-12 border-slate-200`}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className={fieldLabelClass}>Zona o barrio</label>
                    <input
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
                      placeholder="Zona / Barrio"
                      className={`${inputBaseClass} h-12 border-slate-200`}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className={fieldLabelClass}>Tipo de via</label>
                    <input
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
                      placeholder="Tipo"
                      className={`${inputBaseClass} h-12 border-slate-200`}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className={fieldLabelClass}>Numero</label>
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
                      placeholder="Numero"
                      className={`${inputBaseClass} h-12 border-slate-200`}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className={fieldLabelClass}>Numero secundario</label>
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
                      placeholder="Ej: 23-18"
                      className={`${inputBaseClass} h-12 border-slate-200`}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className={fieldLabelClass}>Complemento</label>
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
                      placeholder="Apto, casa, torre..."
                      className={`${inputBaseClass} h-12 border-slate-200`}
                      disabled={saving}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className={fieldLabelClass}>Direccion</label>
                  <input
                    value={direccion}
                    onChange={(e) => {
                      markTouched("direccion");
                      setDireccion(e.target.value);
                    }}
                    onBlur={() => markTouched("direccion")}
                    placeholder="Ej. Calle 123 #45-67"
                    className={[
                      inputBaseClass,
                      "h-12 border-slate-200",
                      shouldShowError("direccion") && errors.direccion
                        ? "border-red-500"
                        : "",
                    ].join(" ")}
                  />
                  {shouldShowError("direccion") && errors.direccion && (
                    <p className="mt-2 text-xs text-red-600">{errors.direccion}</p>
                  )}
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className={`${fieldLabelClass} mb-0`}>Descripcion</label>
                  <span className="text-xs text-slate-400">
                    {description.trim().length} caracteres
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    markTouched("description");
                    setDescription(e.target.value);
                  }}
                  onBlur={() => markTouched("description")}
                  rows={5}
                  placeholder="Describe brevemente el problema o el servicio que necesitas."
                  className={[
                    inputBaseClass,
                    "min-h-[132px] resize-y border-slate-200 py-3",
                    shouldShowError("description") && errors.description
                      ? "border-red-500"
                      : "",
                  ].join(" ")}
                />
                {shouldShowError("description") && errors.description && (
                  <p className="mt-2 text-xs text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
}
