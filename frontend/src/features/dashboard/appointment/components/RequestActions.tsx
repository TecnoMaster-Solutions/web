"use client";

import { useRouter } from "next/navigation";
import type { ServiceRequestDTO } from "@/features/dashboard/requests/services/servicerequests.service";
import { routes } from "@/shared/routes";
import { actionButtonClass, dangerButtonClass } from "./actionButtonClasses";

export type RequestActionsProps = {
  request: ServiceRequestDTO;
  onEdit: (request: ServiceRequestDTO) => void;
  canEdit?: boolean;
  canCancel?: boolean;
  onCancel?: (request: ServiceRequestDTO) => void;
};

const RequestActions = ({
  request,
  onEdit,
  canEdit = false,
  canCancel = false,
  onCancel,
}: RequestActionsProps) => {
  const router = useRouter();
  const base = routes.dashboard.requestsServices;

  return (
    <div className="flex flex-wrap gap-2 pt-3">
      {canEdit && (
        <button onClick={() => onEdit(request)} className={actionButtonClass} type="button">
          Editar
        </button>
      )}
      <button
        onClick={() => router.push(`${routes.dashboard.requestsServices}/${request.serviceRequestId}`)}
        className={actionButtonClass}
        type="button"
      >
        Ver detalle
      </button>
      {canCancel && (
        <button
          onClick={() =>
            onCancel
              ? onCancel(request)
              : router.push(`${base}?serviceRequestId=${request.serviceRequestId}&action=cancel`)
          }
          className={dangerButtonClass}
          type="button"
        >
          Cancelar
        </button>
      )}
    </div>
  );
};

export default RequestActions;
