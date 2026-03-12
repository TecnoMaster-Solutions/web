"use client";

import React from "react";
import Colors from "@/shared/theme/colors";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { DataTable } from "../components/datatable/DataTable";
import EditClientModal from "./components/EditClientsModal/EditClients";
import ViewClientModal from "./components/ViewClientsModal/ViewClients";
import CreateClientModal from "./components/CreateClientsModal/CreateClients";

import { useClients } from "./hooks/useClients";
import { Client } from "./types/typeClients";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ClientsPage() {
  const {
    clients,
    loading,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingClient,
    viewingClient,
    handleCreateClient,
    handleEditClient,
    handleDeleteClient,
    handleView,
    handleEdit,
    closeModals,
  } = useClients();

  const clientActionGuard = (client: Client) => {
    if (!client.hasAssociations) return {};

    return {
      disableDelete: true,
      deleteTitle: "El usuario no se puede eliminar porque tiene registros asociados",
    };
  };

  const columns: Column<Client>[] = [
    { key: "id", header: "ID" },
    { key: "tipo", header: "Tipo" },
    { key: "documento", header: "Documento" },
    {
      key: "nombre",
      header: "Nombre completo",
      render: (row: Client) =>
        `${row.nombre}${row.apellido ? " " + row.apellido : ""}`,
    },
    { key: "telefono", header: "Teléfono" },
    { key: "correoElectronico", header: "Correo electrónico" },
    { key: "ciudad", header: "Ciudad" },
    { key: "codigoPostal", header: "Código Postal" },
    {
      key: "estado",
      header: "Estado",
      render: (row: Client) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: row.estado === "Activo" ? "#e8f5e8" : "#f5e8e8",
            color:
              row.estado === "Activo"
                ? Colors.states.success
                : Colors.states.inactive,
          }}
        >
          {row.estado}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <ToastContainer position="bottom-right" autoClose={3000} theme="light" />

      <main className="p-6">
        <div className="rounded-lg shadow-sm">
          <CreateClientModal
            isOpen={isCreateModalOpen}
            onClose={closeModals}
            onSave={handleCreateClient}
            clients={clients}
          />

          <EditClientModal
            isOpen={!!editingClient}
            client={editingClient}
            onClose={closeModals}
            onSave={handleEditClient}
            clients={clients}
          />

          <ViewClientModal
            isOpen={!!viewingClient}
            client={viewingClient}
            onClose={closeModals}
          />

          {loading ? (
            <Loader />
          ) : (
            <DataTable<Client>
              module="customers"
              data={clients}
              columns={columns}
              pageSize={10}
              searchableKeys={[
                "nombre",
                "apellido",
                "documento",
                "correoElectronico",
                "telefono",
                "estado",
                "ciudad",
                "codigoPostal",
              ]}
              onCreate={() => setIsCreateModalOpen(true)}
              createButtonText="Crear Cliente"
              searchPlaceholder="Buscar clientes..."
              onView={handleView}
              onEdit={handleEdit}
              onDelete={(client) => handleDeleteClient(client.id)}
              actionGuard={clientActionGuard}
            />
          )}
        </div>
      </main>
    </div>
  );
}
