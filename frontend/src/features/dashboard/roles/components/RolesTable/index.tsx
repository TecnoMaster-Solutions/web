import React, { useMemo } from "react";
import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";
import { Role } from "../../types/typeRoles";
import Colors from "@/shared/theme/colors";

interface RolesTableProps {
  roles: Role[];
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onCreate: () => void;
}

type RoleRow = Role & {
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

const buildSearchText = (role: Role): string => {
  const parts: string[] = [];

  const add = (val?: string | number | null) => {
    if (val === undefined || val === null) return;
    const str = String(val).trim();
    if (!str) return;
    parts.push(normalizeForSearch(str));
  };

  add(role.id);
  add(role.name);

  return parts.join(" ");
};

export const RolesTable: React.FC<RolesTableProps> = ({
  roles,
  onView,
  onEdit,
  onDelete,
  onCreate,
}) => {
  const protectDefaultAdmin = (role: RoleRow) => {
    const isFirstAdmin = Number(role.id) === 1;
    if (!isFirstAdmin) return {};

    return {
      disableEdit: true,
      disableDelete: true,
      editTitle: "No puedes editar el rol administrador inicial",
      deleteTitle: "No puedes eliminar el rol administrador inicial",
    };
  };

  const rows: RoleRow[] = useMemo(() => {
    const sortedRoles = [...roles].sort(
      (a, b) => Number(a.id ?? 0) - Number(b.id ?? 0)
    );

    return sortedRoles.map((r, index) => ({
      ...r,
      rowNumber: index + 1,
      searchText: buildSearchText(r),
      stateSearch: toStateSearch(r.state),
    }));
  }, [roles]);

  const columns: Column<RoleRow>[] = [
    { key: "rowNumber", header: "#" },
    { key: "name", header: "Nombre" },
    {
      key: "state",
      header: "Estado",
      render: (role: RoleRow) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            color:
              role.state === "Activo"
                ? Colors.states.success
                : Colors.states.inactive,
          }}
        >
          {role.state}
        </span>
      ),
    },
  ];

  return (
    <DataTable<RoleRow>
      module="roles"
      data={rows}
      columns={columns}
      pageSize={6}
      searchableKeys={["searchText", "stateSearch"]}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onCreate={onCreate}
      searchPlaceholder="Buscar roles..."
      createButtonText="Crear Rol"
      actionGuard={protectDefaultAdmin}
    />
  );
};

export default RolesTable;
