"use client";

import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ServicesTable from "./components/ServicesTable";
import CreateServiceModal from "./components/CreateServicesModal/CreateServicesModal";
import EditServiceModal from "./components/EditServicesModal/EditServicesModal";
import ViewServiceModal from "./components/ViewServicesModal/ViewServicesModal";

import { Service } from "./types/typesServices";
import { useServices } from "./hooks/useServices";

export default function ServiciosIndex() {
  const {
    services,
    loading,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    editingService,
    setEditingService,
    handleCreateService,
    handleEditService,
    handleDeleteService,
  } = useServices();

  const [viewingService, setViewingService] = useState<Service | null>(null);

  return (
    <div className="min-h-screen flex">
      <ToastContainer position="bottom-right" />

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[99999]">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex flex-col">
          <div className="px-6 pt-6">
            <CreateServiceModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onSave={handleCreateService}
              services={services}
            />

            <EditServiceModal
              isOpen={isEditModalOpen}
              service={editingService}
              onClose={() => setEditingService(null)}
              onSave={(data) => handleEditService(data.id, data)}
              services={services}
            />

            <ViewServiceModal
              isOpen={!!viewingService}
              onClose={() => setViewingService(null)}
              service={viewingService}
            />

            <ServicesTable
              services={services}
              onView={(s) => setViewingService(s)}
              onEdit={(s) => setEditingService(s)}
              onDelete={handleDeleteService}
              onCreate={() => setIsCreateModalOpen(true)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
