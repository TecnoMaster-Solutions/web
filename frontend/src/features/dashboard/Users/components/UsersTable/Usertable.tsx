import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import {
  User,
  EditUser,
  UserForTable,
  UsersTableProps,
} from "../../types/typesUser";
import Colors from "@/shared/theme/colors";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";

const mapStateIdToLabel = (stateid: number): string => {
  const states: Record<number, string> = {
    1: "Activo",
    2: "Inactivo",
  };
  return states[stateid] || "Desconocido";
};

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onView,
  onEdit,
  onDelete,
  onCreate,
}) => {
  const usersForTable: UserForTable[] = users.map((u, index) => ({
    ...u,
    rowNumber: index + 1,
    stateLabel: mapStateIdToLabel(u.stateid),
    stateSearch: u.stateid === 1 ? "activo" : "inactivo",
    fullNameSearch: `${u.name ?? ""} ${u.lastname ?? ""}`.toLowerCase().trim(),
  }));

  const actionGuard = (u: UserForTable) => {
    if (u.hasAssociations) {
      return {
        disableDelete: true,
        deleteTitle: "El usuario no se puede eliminar porque tiene registros asociados",
      };
    }

    const roleName = u.roles?.name?.toLowerCase();
    const isAdmin = roleName === "admin" || u.roleid === 1;
    const isFirstUser = u.id === 1 || u.userid === 1;

    if (isAdmin && isFirstUser) {
      return {
        disableEdit: true,
        disableDelete: true,
        editTitle: "No se puede editar este usuario admin",
        deleteTitle: "No se puede eliminar este usuario admin",
      };
    }
    return {};
  };


  //Columnas del DataTable
  const columns: Column<UserForTable>[] = [
    { key: "rowNumber", header: "#" },
    {
      key: "typeofdocuments",
      header: "Tipo Doc.",
      render: (u) => u.typeofdocuments?.name || "Sin tipo",
    },
    { key: "documentnumber", header: "N° Documento" },
    {
      key: "name",
      header: "Nombre Completo",
      render: (u) => `${u.name} ${u.lastname || ""}`.trim(),
    },
    { key: "phone", header: "Teléfono" },
    { key: "email", header: "Correo Electrónico" },
    {
      key: "roles",
      header: "Rol",
      render: (u) => u.roles?.name || "Sin rol",
    },
    {
      key: "stateid",
      header: "Estado",
      render: (u) => {
        const label = u.stateid === 1 ? "Activo" : "Inactivo";
        return (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              color:
                label === "Activo"
                  ? Colors.states.success
                  : Colors.states.inactive,
            }}
          >
            {label}
          </span>
        );
      },
    },
  ];


  // Funciones adaptadoras
  const handleView = (u: UserForTable) => onView(u as User);
  const handleEdit = (u: UserForTable) => onEdit(u as EditUser);
  const handleDelete = (u: UserForTable) => onDelete(u as User);

  return (
    <DataTable<UserForTable>
      module="users"
      data={usersForTable}
      columns={columns}
      pageSize={10}
      searchableKeys={[
        "name",
        "fullNameSearch",
        "lastname",
        "email",
        "documentnumber",
        "phone",
        "typeofdocuments",
        "stateSearch",
      ]}

      onView={handleView}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={onCreate}
      actionGuard={actionGuard}
      searchPlaceholder="Buscar por nombre, correo, documento o teléfono…"
      createButtonText="Crear Usuario"
    />

  );
};

export default UsersTable;
