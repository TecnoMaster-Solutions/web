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
  onView: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onCreate: () => void;
}

type ServiceRow = Service & {
  rowNumber: number;
  searchText: string;
  stateSearch: "activo" | "inactivo";
};

const normalizeForSearch = (value: string): string => {
  const lower = value.toLowerCase();
  const withoutAccents = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return `${lower} ${withoutAccents}`;
};

const toStateSearch = (state: unknown): "activo" | "inactivo" => {
  const s = String(state ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  return s === "activo" ? "activo" : "inactivo";
};

const buildSearchText = (s: Service): string => {
  const parts: string[] = [];

  const add = (val?: string | number | null) => {
    if (val === undefined || val === null) return;
    const str = String(val).trim();
    if (!str) return;
    parts.push(normalizeForSearch(str));
  };

  add(s.id);
  add(s.name);
  add(s.category);

  return parts.join(" ");
};

export const ServicesTable: React.FC<ServicesTableProps> = ({
  services,
  onView,
  onEdit,
  onDelete,
  onCreate,
}) => {
  const sortedServices = useMemo(
    () =>
      [...services].sort(
        (a, b) => Number(b.id ?? 0) - Number(a.id ?? 0) // DESC
      ),
    [services]
  );

  const rows: ServiceRow[] = useMemo(() => {
    const total = sortedServices.length;

    return sortedServices.map((s, index) => ({
      ...s,
      rowNumber: total - index,
      searchText: buildSearchText(s),
      stateSearch: toStateSearch(s.state),
    }));
  }, [sortedServices]);

  const columns: Column<ServiceRow>[] = [
    { key: "rowNumber", header: "#" },
    {
      key: "name",
      header: "Nombre",
      render: (s: ServiceRow) => (
        <div className="max-w-[220px] whitespace-normal break-words [overflow-wrap:anywhere] leading-5">
          {s.name ?? ""}
        </div>
      ),
    },
    { key: "category", header: "Categoría" },
    {
      key: "image",
      header: "Imagen",
      render: (s: ServiceRow) => {
        const image =
          typeof s.image === "string"
            ? s.image.trim()
            : s.image instanceof File
              ? URL.createObjectURL(s.image)
              : "";

        const isBase64 = typeof image === "string" && image.startsWith("data:image");
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
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                e.currentTarget.insertAdjacentHTML(
                  "afterend",
                  `<span class="text-gray-400 text-xs italic">Sin imagen</span>`
                );
              }}
            />
          </div>
        );
      },
    },
    {
      key: "state",
      header: "Estado",
      render: (s: ServiceRow) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            color:
              s.state === "Activo" ? Colors.states.success : Colors.states.inactive,
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
      pageSize={6}
      searchableKeys={["searchText", "stateSearch"]}
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
              data={sortedServices as unknown as Record<string, unknown>[]}
              fileName="reporte_servicios.xlsx"
              headers={["#", "Nombre", "Categoría", "Estado"]}
            />
          </div>

          <button
            onClick={() =>
              document
                .querySelector<HTMLButtonElement>("#download-excel-btn-services")
                ?.click()
            }
            className="fixed bottom-20 right-6 z-50 flex md:hidden items-center justify-center w-12 h-12 rounded-full shadow-lg text-white transition-transform hover:scale-105"
            style={{ background: "#B20000" }}
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
