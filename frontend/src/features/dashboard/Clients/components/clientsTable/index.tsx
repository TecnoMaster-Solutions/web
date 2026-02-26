import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Client } from "../../types/typeClients";
import Colors from "@/shared/theme/colors";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";

interface ClientsTableProps {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onCreate: () => void;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  onView,
  onEdit,
  onDelete,
  onCreate,
}) => {
  const columns: Column<Client>[] = [
    { key: "id", header: "Id" },
    { key: "tipo", header: "Tipo" },
    { key: "documento", header: "Documento" },
    {
      key: "nombre",
      header: "Nombre completo",
      render: (client: Client) =>
        `${client.nombre}${client.apellido ? " " + client.apellido : ""}`,
    },
    { key: "telefono", header: "Teléfono" },
    { key: "correoElectronico", header: "Correo electrónico" },
    {
      key: "estado",
      header: "Estado",
      render: (client: Client) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor:
              client.estado === "Activo" ? "#e8f5e8" : "#f5e8e8",
            color:
              client.estado === "Activo"
                ? Colors.states.success
                : Colors.states.inactive,
          }}
        >
          {client.estado}
        </span>
      ),
    },
  ];

  return (
    <DataTable<Client>
      data={clients}
      columns={columns}
      pageSize={10}
      searchableKeys={[
        "id",
        "tipo",
        "documento",
        "nombre",
        "telefono",
        "correoElectronico",
        "estado",
      ]}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onCreate={onCreate}
      searchPlaceholder="Buscar clientes..."
      createButtonText="Crear Cliente"
      module="clients"   // 🔥 AQUÍ ESTABA EL PROBLEMA
    />
  );
};

export default ClientsTable;