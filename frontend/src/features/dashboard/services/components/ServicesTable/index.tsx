"use client";

import React, { useMemo } from "react";
import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";
import Colors from "@/shared/theme/colors";
import { Service } from "../../types/typesServices";
import DownloadXLSXButton from "../../../components/DownloadXLSXButton";
import Image from "next/image";

interface ServicesTableProps {
  services: Service[];
  page: number;
  limit: number;
  totalPages: number;
  search: string;
  tableLoading?: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (value: string) => void;
  onView: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onCreate: () => void;
}

type ServiceRow = Service;

export const ServicesTable: React.FC<ServicesTableProps> = ({
  services,
  page,
  limit,
  totalPages,
  search,
  tableLoading = false,
  onPageChange,
  onSearchChange,
  onView,
  onEdit,
  onDelete,
  onCreate,
}) => {
  const rows: ServiceRow[] = useMemo(() => {
    return [...services].sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
  }, [services]);

  const columns: Column<ServiceRow>[] = [
    {
      key: "id",
      header: "ID",
      render: (s) => <span className="tabular-nums whitespace-nowrap">{s.id}</span>,
    },
    {
      key: "name",
      header: "Nombre",
      render: (s) => (
        <div className="max-w-[220px] whitespace-normal break-words [overflow-wrap:anywhere] leading-5">
          {s.name ?? ""}
        </div>
      ),
    },
    { key: "category", header: "Categoría" },
    {
      key: "image",
      header: "Imagen",
      render: (s) => {
        const image =
          typeof s.image === "string"
            ? s.image.trim()
            : s.image instanceof File
            ? URL.createObjectURL(s.image)
            : "";

        const isBase64 =
          typeof image === "string" && image.startsWith("data:image");
        const isBlob = typeof image === "string" && image.startsWith("blob:");

        if (!image) {
          return (
            <div className="w-full flex justify-center">
              <span className="text-gray-400 text-xs italic">Sin imagen</span>
            </div>
          );
        }

        return (
          <div className="w-full flex justify-center items-center">
            <Image
              src={image}
              alt={s.name}
              className="w-10 h-10 object-cover rounded-md border border-gray-200"
              width={40}
              height={40}
              unoptimized={isBase64 || isBlob}
            />
          </div>
        );
      },
    },
    {
      key: "state",
      header: "Estado",
      render: (s) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            color:
              s.state === "Activo"
                ? Colors.states.success
                : Colors.states.inactive,
          }}
        >
          {s.state}
        </span>
      ),
    },
  ];

  return (
    <DataTable<ServiceRow>
      module="services"
      data={rows}
      columns={columns}
      pageSize={limit}
      searchableKeys={["name"]}
      serverPagination={{
        page,
        totalPages,
        onPageChange,
      }}
      serverSearch={{
        value: search,
        onChange: onSearchChange,
      }}
      loading={tableLoading}
      onView={onView as (s: ServiceRow) => void}
      onEdit={onEdit as (s: ServiceRow) => void}
      onDelete={onDelete as (s: ServiceRow) => void}
      onCreate={onCreate}
      searchPlaceholder="Buscar servicios..."
      createButtonText="Crear Servicio"
      rightActions={
        <>
          <div className="hidden md:block">
            <DownloadXLSXButton
              id="download-excel-btn-services"
              data={rows as unknown as Record<string, unknown>[]}
              fileName="reporte_servicios.xlsx"
              headers={["ID", "Nombre", "Categoría", "Estado"]}
            />
          </div>

          <button
            onClick={() =>
              document
                .querySelector<HTMLButtonElement>("#download-excel-btn-services")
                ?.click()
            }
            className="fixed bottom-20 right-6 z-50 flex md:hidden items-center justify-center w-12 h-12 rounded-full shadow-lg text-white transition-transform hover:scale-105"
            style={{ background: "#04652c" }}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
              />
            </svg>
          </button>
        </>
      }
    />
  );
};

export default ServicesTable;
