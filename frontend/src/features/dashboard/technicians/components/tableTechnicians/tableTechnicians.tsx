"use client";

import { useMemo } from "react";
import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";
import Colors from "@/shared/theme/colors";
import { Technician } from "../../types/typesTechnicians";

interface TechniciansTableProps {
  technicians: Technician[];
  page: number;
  limit: number;
  totalPages: number;
  search: string;
  tableLoading?: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (value: string) => void;
  onView: (t: Technician) => void;
  onEdit: (t: Technician) => void;
  onDelete: (t: Technician) => void;
  onCreate: () => void;
}

type TechnicianRow = Technician;

function abbreviateType(type: string): string {
  const clean = type.trim();
  if (!clean) return clean;

  const lc = clean.toLowerCase();

  if (lc.startsWith("cableado estructurado")) return "CE";

  if (clean.length <= 15) return clean;

  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return `${words[0].slice(0, 4)}. ${words[1].slice(0, 7)}`;
  }

  return `${clean.slice(0, 12)}…`;
}

const TechniciansTable: React.FC<TechniciansTableProps> = ({
  technicians,
  page,
  limit,
  totalPages,
  search,
  tableLoading = false,
  onView,
  onEdit,
  onDelete,
  onCreate,
  onPageChange,
  onSearchChange,
}) => {
  const rows: TechnicianRow[] = useMemo(() => {
    return [...technicians].sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
  }, [technicians]);

  const columns: Column<TechnicianRow>[] = [
    { key: "id", header: "ID" },
    {
      key: "name",
      header: "Nombre",
      render: (t) => {
        const fullName = `${t.name ?? ""} ${t.lastName ?? ""}`.trim();
        const words = fullName.split(/\s+/).filter(Boolean);

        if (words.length <= 2) {
          return (
            <div className="max-w-[180px] whitespace-normal leading-5">
              {fullName}
            </div>
          );
        }

        return (
          <div className="max-w-[180px] whitespace-normal leading-5">
            <div>{words.slice(0, 2).join(" ")}</div>
            <div>{words.slice(2).join(" ")}</div>
          </div>
        );
      },
    },
    {
      key: "documentNumber",
      header: "Documento",
      render: (t) =>
        `${t.documentType ?? ""} ${t.documentNumber ?? ""}`.trim() || "—",
    },
    { key: "phone", header: "Teléfono" },
    {
      key: "email",
      header: `Correo\nElectrónico`,
    },
    {
      key: "types",
      header: "Tipos técnico",
      render: (t) => {
        const types = t.types ?? [];
        if (!types.length) {
          return (
            <div className="max-w-[220px] whitespace-normal leading-5 text-center">
              Sin especificar
            </div>
          );
        }

        return (
          <div className="max-w-[220px] whitespace-normal leading-5">
            <div className="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1">
              {types.map((tp) => (
                <span
                  key={tp}
                  className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-800"
                >
                  {abbreviateType(tp)}
                </span>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      key: "state",
      header: "Estado",
      render: (t) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            color:
              t.state === "Activo"
                ? Colors.states.success
                : Colors.states.inactive,
          }}
        >
          {t.state}
        </span>
      ),
    },
  ];

  return (
    <DataTable<TechnicianRow>
      module="technicians"
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
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onCreate={onCreate}
      searchPlaceholder="Buscar técnicos..."
      createButtonText="Crear Técnico"
    />
  );
};

export default TechniciansTable;