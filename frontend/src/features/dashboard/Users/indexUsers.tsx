"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CreateUserModal from "./components/CreateUserModal/CreateUser";
import UsersTable from "./components/UsersTable/Usertable";
import EditUserModal from "./components/EditUserModal/EditUser";
import ViewUserModal from "./components/ViewUserModal/viewUser";
import { useUser } from "./hooks/useUsers";

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function UsersPage() {
  const {
    users,
    loading,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingUser,
    viewingUser,
    handleCreateUser,
    handleEditUser,
    handleView,
    handleEdit,
    handleDelete,
    closeModals
  } = useUser();

  // Determinar si los modales están abiertos basado en el estado
  const isEditModalOpen = !!editingUser;
  const isViewModalOpen = !!viewingUser;

  return (
    <div className="min-h-screen flex">
      {/* Toast Container para mostrar notificaciones */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-6 overflow-hidden">

            <CreateUserModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onSave={handleCreateUser}
              users={users}
            />

            <EditUserModal
              isOpen={isEditModalOpen}
              onClose={closeModals}
              onSave={handleEditUser}
              user={editingUser}
              users={users}
            />

            <ViewUserModal
              isOpen={isViewModalOpen}
              onClose={closeModals}
              user={viewingUser}
            />

            {/* NO necesitas DeleteConfirmation modal aquí */}
            {/* SweetAlert2 se encargará del modal de confirmación */}

            {loading ? (
              <Loader />
            ) : (
              <UsersTable
                users={Array.isArray(users) ? users : []}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreate={() => setIsCreateModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
