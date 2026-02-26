import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
import { DataTable } from "../../../../../dashboard/components/datatable/DataTable";
import { Column } from "../../../../../dashboard/components/datatable/types/column.types";
import {
  purchaseOrder,
  purchaseOrderForTable,
  PurchaseOrdersTableProps
} from "../../types/typesPurchaseOrder";
import Colors from "@/shared/theme/colors";

export const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({
  purchaseOrders,
  onView,
  onCreate,
  rightActions,
}) => {

  // Convertir órdenes de compra para la tabla asegurando que tengan ID
  // searchQuery: campo auxiliar de texto plano para que el DataTable busque correctamente
  // (el campo numeroOrden tiene timestamps que el DataTable trata como números)
  const purchaseOrdersForTable: purchaseOrderForTable[] =
    purchaseOrders.map((order, index) => ({
      ...order,
      id: order.id || index + 1,
      // Campo de búsqueda extra — cadena de texto plano sin números sueltos
      searchQuery: `${order.numeroOrden ?? ""} ${order.proveedor ?? ""} ${order.estado ?? ""} ${order.fecha ?? ""}`.toLowerCase(),
    }));

  const columns: Column<purchaseOrderForTable>[] = [
    { key: "id", header: "#" },
    { key: "numeroOrden", header: "N° Orden" },
    { key: "proveedor", header: "Proveedor" },
    { key: "fecha", header: "Fecha" },
    {
      key: "total",
      header: "Total",
      render: (order) =>
        `$${order.total.toLocaleString("es-CO")}`
    },
    {
      key: "items",
      header: "Productos",
      render: (order) => order.items.length
    },
    {
      key: "estado",
      header: "Estado",
      render: (order) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ color: Colors.states.warning }}
        >
          {order.estado}
        </span>
      )
    }
  ];

  const handleView = (order: purchaseOrderForTable) => {
    onView(order as purchaseOrder);
  };

  const renderActions = (row: purchaseOrderForTable) => (
    <div className="flex items-center justify-center gap-3 text-gray-600">

      {/* View Button - Única acción permitida */}
      <button
        className="p-1 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-gray-200"
        title="Ver"
        onClick={() => handleView(row)}
      >
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>

    </div>
  );


  return (
    <DataTable<purchaseOrderForTable>
      data={purchaseOrdersForTable}
      columns={columns}
      pageSize={10}
      searchableKeys={["searchQuery"]}
      renderActions={renderActions}
      onCreate={onCreate}
      rightActions={rightActions}
      searchPlaceholder="Buscar por número de orden, proveedor, estado o fecha…"
      createButtonText="Crear Orden"
      module={"purchaseOrders"}
    />
  );
};

export default PurchaseOrdersTable;