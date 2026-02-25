"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/features/auth/requireauth";
import { useServiceRequest } from "../hooks/useServiceRequests";
import type { ServiceRequestDTO } from "@/features/dashboard/requests/services/servicerequests.service";
import { ArrowLeft } from "lucide-react";

interface Props {
  requestId: number;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const RequestLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
  </div>
);

const buildTechnicianLabel = (
  tech:
    | {
        technicianid?: number;
        technicianId?: number;
        users?: { name?: string | null; lastname?: string | null };
        title?: string | null;
      }
    | null
    | undefined
) => {
  if (!tech) return null;
  const parts = [tech.users?.name ?? "", tech.users?.lastname ?? ""].filter(Boolean);
  const name = parts.length ? parts.join(" ").trim() : undefined;
  const id = tech.technicianid ?? tech.technicianId;
  if (name) return `${name}${id ? ` (${id})` : ""}`;
  if (id) return `Tecnico ${id}`;
  if (tech.title) return tech.title;
  return "Tecnico";
};

const ServiceRequestDetailContent = ({ data }: { data: ServiceRequestDTO }) => {
  const router = useRouter();

  const clientLabel = useMemo(() => {
    if (!data.customer) return "Cliente no asignado";
    const parts = [
      data.customer.users?.name ?? "",
      data.customer.users?.lastname ?? "",
      data.customer.customercity ?? "",
    ].filter(Boolean);
    return parts.length
      ? parts.join(" · ")
      : `Cliente ${data.customer.customerid ?? data.clientId ?? ""}`;
  }, [data]);

  const technicians = useMemo(() => {
    const sources = [
      data.technicians,
      data.serviceRequestTechnicians,
      data.assignedTechnicians,
      data.requestTechnicians,
      data.techniciansMap?.map((entry) => entry?.technician),
    ];
    const list = sources.flatMap((set) => (Array.isArray(set) ? set : []));
    const uniques: Record<string, typeof list[number]> = {};
    list.forEach((tech) => {
      const key = `${tech?.technicianid ?? tech?.technicianId ?? "none"}-${
        tech?.users?.name ?? ""
      }-${tech?.users?.lastname ?? ""}`;
      if (key && !uniques[key]) uniques[key] = tech;
    });
    return Object.values(uniques);
  }, [data]);

  const scheduled = formatDateTime(data.scheduledAt);
  const scheduledEnd = formatDateTime(data.scheduledEndAt);
  const created = formatDateTime(data.createdAt);

  const customerUser = data.customer?.users;
  const customerFullName = [customerUser?.name, customerUser?.lastname]
    .filter(Boolean)
    .join(" ");
  const customerDocument = customerUser?.documentnumber;
  const customerEmail = customerUser?.email;
  const customerPhone = customerUser?.phone;
  const customerCity = data.customer?.customercity ?? "-";
  const customerZip = data.customer?.customerzipcode ?? "-";

  const stateLabel = data.state?.name ?? "-";
  const stateDescription = data.state?.description ?? "Sin descripcion del estado.";

  const serviceDescription = data.service?.description;
  const serviceImage = data.service?.image;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver atrás
          </button>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Solicitud de servicio
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              SRV-{String(data.serviceRequestId).padStart(6, "0")}
            </h1>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p className="font-semibold text-slate-800">
              {data.service?.name ?? "Servicio sin nombre"}
            </p>
            <p>{data.serviceType ?? "-"}</p>
            <p className="text-xs text-slate-500">Estado actual: {stateLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Cliente</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{clientLabel}</p>
            <p className="text-xs text-slate-500">
              Ciudad: {customerCity} · Codigo postal: {customerZip}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Programada</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{scheduled}</p>
            <p className="text-xs text-slate-500">Fin estimado: {scheduledEnd}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Creada</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{created}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Servicio</p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {data.service?.name ?? "-"}
            </p>
            <p className="text-xs text-slate-500">Tipo: {data.serviceType ?? "-"}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Estado</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{stateLabel}</p>
            <p className="text-xs text-slate-500">{stateDescription}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Descripcion y detalles
        </h2>
        <p className="mt-4 text-sm text-slate-700">
          {data.description || "Sin descripcion adicional."}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Direccion</p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {data.direccion ?? "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Estado</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{stateLabel}</p>
            <p className="text-xs text-slate-500">{stateDescription}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Tecnicos asignados</h2>
        {technicians.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {technicians.map((tech, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {buildTechnicianLabel(tech)}
                </p>
                <p className="text-xs text-slate-500">
                  Titulo: {tech?.title ?? "-"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No hay tecnicos asignados.
          </p>
        )}
      </section>
    </div>
  );
};

const ServiceRequestDetail: React.FC<Props> = ({ requestId }) => {
  const { data, isLoading, isError } = useServiceRequest(requestId, requestId > 0);
  const invalidId = !Number.isFinite(requestId) || requestId <= 0;

  if (invalidId) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-600">Identificador invalido</p>
            <p className="mt-2 text-sm text-red-800">No se puede cargar la solicitud.</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (isLoading) {
    return (
      <RequireAuth>
        <RequestLoader />
      </RequireAuth>
    );
  }

  if (isError || !data) {
    return (
      <RequireAuth>
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-6">
          <p className="text-sm font-medium text-red-500">
            No se pudo obtener la informacion de la solicitud.
          </p>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <ServiceRequestDetailContent data={data} />
    </RequireAuth>
  );
};

export default ServiceRequestDetail;
