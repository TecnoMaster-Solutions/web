"use client";

import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useRoles } from "./hooks/useRoles";
import RolesTable from "./components/RolesTable";
import CreateRoleModal from "./components/CreateRoleModal/CreateRoleModal";
import EditRoleModal from "./components/EditRoleModal/EditRoleModal";
import ViewRoleModal from "./components/ViewRoleModal/ViewRole";

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Index() {
  const {
    roles,
    loading,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isViewModalOpen,
    setIsViewModalOpen,
    viewingRole,
    selectedRole,
    handleCreateRole,
    handleEditRole,
    handleView,
    handleEdit,
    handleDelete,
    creating,
  } = useRoles();

  return (
    <div className="min-h-screen flex">
      <ToastContainer position="bottom-right" />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex flex-col">
          <div className="px-6 pt-6">
            <CreateRoleModal
              open={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onSubmit={(data) => handleCreateRole(data)}
              existingRoles={roles}
              loading={creating}
            />

            <EditRoleModal
              isOpen={isEditModalOpen}
              role={selectedRole}
              onClose={() => setIsEditModalOpen(false)}
              onSave={(id, data) => handleEditRole(id, data)}
              existingRoles={roles}
            />

            <ViewRoleModal
              open={isViewModalOpen}
              role={viewingRole}
              onClose={() => setIsViewModalOpen(false)}
            />

            <RolesTable
              roles={roles}
              onView={(r) => {
                handleView(r);
                setIsViewModalOpen(true);
              }}
              onEdit={(r) => {
                handleEdit(r);
                setIsEditModalOpen(true);
              }}
              onDelete={handleDelete}
              onCreate={() => setIsCreateModalOpen(true)}
            />

            {loading && <Loader />}
          </div>
        </main>
      </div>
    </div>
  );
}
