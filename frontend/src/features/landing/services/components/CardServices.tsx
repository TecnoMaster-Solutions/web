"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import ClientRequestModal, {
  type CreateRequestPayload,
} from "@/features/dashboard/requests/components/ClientRequestModal";
import {
  createServiceRequest,
  type ServiceTypeApi,
  type CreateServiceRequestInput,
} from "@/features/dashboard/requests/services/servicerequests.service";
import { showError, showInfo, showSuccess } from "@/shared/utils/notifications";
import { useAuth } from "@/features/auth/authcontext";
import { useRequestStates } from "@/features/dashboard/requests/hooks/useRequestStates";

interface CardServicesProps {
  title: string;
  description: string;
  category?: string;
  image?: string;
  serviceId: number;
  clientId: number;
  clientLabel?: string;
}

function resolveServiceType(category?: string): ServiceTypeApi {
  const s = String(category || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (s.includes("instal")) return "INSTALACION";
  return "MANTENIMIENTO";
}

function getBackendMessage(err: any) {
  const msg = err?.response?.data?.message ?? err?.message ?? "";
  if (Array.isArray(msg)) return msg.filter(Boolean).join(" | ");
  return String(msg || "");
}

export default function CardServices({
  title,
  description,
  category,
  image,
  serviceId,
  clientId,
  clientLabel,
}: CardServicesProps) {
  const [open, setOpen] = useState(false);

  const { ready, isAuthenticated, user, profile } = useAuth();
  const { pendingStateId, scheduledStateId } = useRequestStates();

  const serviceType = useMemo(() => resolveServiceType(category), [category]);

  const isClientRole = useMemo(() => {
    const candidates = [
      user?.rolename,
      (user as any)?.role,
      (user as any)?.role?.name,
      profile?.rolename,
      (profile as any)?.role,
      (profile as any)?.role?.name,
    ];

    const normalized = candidates
      .map((r) =>
        String(r ?? "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

    return normalized.some((r) => r === "cliente" || r === "client" || r.includes("cliente"));
  }, [user, profile]);

  const handleOpenModal = () => {
    if (!ready) {
      showInfo("Cargando sesión...");
      return;
    }
    if (!isAuthenticated) {
      showInfo("Debes iniciar sesión para contratar este servicio.");
      return;
    }
    if (!isClientRole) {
      showInfo("Solo usuarios con rol de Cliente pueden solicitar servicios.");
      return;
    }
    setOpen(true);
  };

  const handleCloseModal = () => setOpen(false);

  const handleSave = async (data: CreateRequestPayload) => {
    if (!isClientRole) {
      showInfo("No tienes permiso para enviar solicitudes de servicio.");
      return;
    }

    const hasSchedule = Boolean(
      (data.scheduledAt && String(data.scheduledAt).trim()) ||
        (data.scheduledEndAt && String(data.scheduledEndAt).trim())
    );

    const fromPayloadState = Number(data?.stateId);
    const resolvedPending =
      pendingStateId && Number.isFinite(pendingStateId) && pendingStateId > 0
        ? Number(pendingStateId)
        : null;
    const resolvedScheduled =
      scheduledStateId && Number.isFinite(scheduledStateId) && scheduledStateId > 0
        ? Number(scheduledStateId)
        : null;

    const stateIdToSend =
      (Number.isFinite(fromPayloadState) && fromPayloadState > 0 && fromPayloadState) ||
      (hasSchedule && resolvedScheduled) ||
      resolvedPending ||
      5;

    const payload: CreateServiceRequestInput = {
      scheduledAt: data.scheduledAt ?? null,
      scheduledEndAt: data.scheduledEndAt ?? null,
      serviceType: (data.serviceType as any) ?? serviceType,
      description: String(data.description ?? "").trim(),
      direccion: String(data.direccion ?? "").trim(),
      stateId: stateIdToSend,
      serviceId: Number(serviceId),
      clientId: Number(clientId) || 0,
      technicians: [],
    };

    try {
      await createServiceRequest(payload);
      showSuccess("Hemos recibido tu solicitud. Pronto nos pondremos en contacto.");
      handleCloseModal();
    } catch (error: any) {
      showError(
        getBackendMessage(error) || "No fue posible registrar la solicitud. Intenta nuevamente."
      );
      throw error;
    }
  };

  return (
    <>
      <motion.div
        className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer font-montserrat flex flex-col h-full"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{
          y: -5,
          boxShadow: "0 12px 20px rgba(0,0,0,0.1)",
        }}
      >
        <div className="h-56 bg-gray-200 flex-shrink-0">
          {image && (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          )}
        </div>

        <div className="p-4 flex flex-col justify-between flex-1 gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            {category && (
              <span className="text-sm font-semibold text-[#B20000]">{category}</span>
            )}
            <p className="text-gray-600 text-sm mt-1">{description}</p>
          </div>

          <motion.button
            className="mt-4 bg-[#B20000] text-white rounded-full px-4 py-2 flex items-center justify-center gap-2"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 4px 12px rgba(178,0,0,0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
            type="button"
            onClick={handleOpenModal}
          >
            Contratar Servicio
          </motion.button>
        </div>
      </motion.div>

      <ClientRequestModal
        isOpen={open}
        onClose={handleCloseModal}
        onSave={handleSave}
        title="Solicitar servicio"
        clientId={Number(clientId) || 0}
        clientLabel={clientLabel}
        initialServiceId={serviceId}
        pendingStateId={pendingStateId ?? undefined}
        scheduledStateId={scheduledStateId ?? undefined}
      />
    </>
  );
}
