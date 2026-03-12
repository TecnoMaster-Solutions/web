import React, { useMemo } from "react";
import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";
import { Role } from "../../types/typeRoles";
import Colors from "@/shared/theme/colors";

interface RolesTableProps {
  roles: Role[];
  page: number;
  limit: number;
  total: number;
  search: string;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (value: string) => void;
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onCreate: () => void;
}

type RoleRow = Role;

export const RolesTable: React.FC<RolesTableProps> = ({
  roles,
  page,
  limit,
  total,
  search,
  loading = false,
  onPageChange,
  onSearchChange,
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

  const rows: RoleRow[] = useMemo(() => roles, [roles]);

  const columns: Column<RoleRow>[] = [
    { key: "id", header: "ID" },
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
      pageSize={limit}
      searchableKeys={["id", "name", "state"]}
      serverPagination={{
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        onPageChange,
      }}
      serverSearch={{
        value: search,
        onChange: onSearchChange,
      }}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onCreate={onCreate}
      searchPlaceholder="Buscar roles..."
      createButtonText="Crear Rol"
      actionGuard={protectDefaultAdmin}
      loading={loading}
    />
  );
};

export default RolesTable;
