import { useState, useEffect, useRef, useCallback } from "react";
import { showSuccess, showError } from "@/shared/utils/notifications";
import { confirmDelete } from "@/shared/utils/Delete/confirmDelete";

import { User, EditUser, CreateUserData } from "../types/typesUser";
import { getUsers, createUser, updateUser, deleteUser } from "../connection/userApi";


//  UTILIDAD: construir payload para creación/edición de usuarios
export const buildUserPayload = (
  user: CreateUserData | EditUser
): Record<string, any> => {
  return {
    name: user.name?.trim(),
    lastname: user.lastname?.trim() ?? null,
    email: user.email?.trim(),
    phone: user.phone?.trim(),
    documentnumber: user.documentnumber?.trim(),
    typeid: user.typeid,
    image: user.image || null,
    stateid: user.stateid,
    roleid: user.roleid,

    // Condicionales opcionales
    ...(user.CV !== undefined && { CV: user.CV }),
    ...(Array.isArray(user.techniciantypeids) &&
      user.techniciantypeids.length > 0 && {
        techniciantypeids: [...user.techniciantypeids],
      }),
    ...(user.customercity !== undefined && { customercity: user.customercity }),
    ...(user.customerzipcode !== undefined && {
      customerzipcode: user.customerzipcode,
    }),
  };
};


  //  HOOK PRINCIPAL

export const useUser = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditUser | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const sortUsers = useCallback(
    (list: User[]) => [...list].sort((a, b) => (a.userid ?? 0) - (b.userid ?? 0)),
    []
  );

  const refreshUsers = useCallback(async () => {
    const list = await getUsers();
    setUsers(sortUsers(list));
    return list;
  }, [sortUsers]);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await refreshUsers();
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        showError("Error al cargar usuarios desde el servidor");
      } finally {
        setLoading(false);
      }
    };

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      load();
    }
  }, [refreshUsers]);


  // CREAR USUARIO

  const handleCreateUser = useCallback(
    async (data: CreateUserData) => {
      setLoading(true);
      try {
        setIsCreateModalOpen(false);

        const payload = buildUserPayload(data);
        await createUser(payload);
        await refreshUsers();

        showSuccess("Usuario creado exitosamente");
      } catch (error: any) {
        console.error("Create error:", error);
        showError(error.message || "Error al crear usuario");
      } finally {
        setLoading(false);
      }
    },
    [refreshUsers]
  );

  // EDITAR USUARIO
  const handleEditUser = useCallback(
    async (data: EditUser) => {
      if (!data.userid) return;

      setLoading(true);
      try {
        const payload = buildUserPayload(data);
        await updateUser(data.userid, payload);
        await refreshUsers();

        showSuccess("Usuario actualizado exitosamente");
        setEditingUser(null);
      } catch (error: any) {
        console.error("Update error:", error);
        showError(error.message || "Error al actualizar usuario");
      } finally {
        setLoading(false);
      }
    },
    [refreshUsers]
  );


  //  ELIMINAR USUARIO
  const handleDelete = useCallback(
    async (userToDelete: User) => {
      return confirmDelete(
        {
          itemName: userToDelete.name,
          itemType: "usuario",
          successMessage: `El usuario "${userToDelete.name}" ha sido eliminado.`,
          errorMessage: "Error al eliminar usuario",
        },
        async () => {
          setLoading(true);
          try {
            if (!userToDelete.userid) return;

            await deleteUser(userToDelete.userid);
            await refreshUsers();
          } catch (error) {
            console.error("Delete error:", error);
            showError("Error al eliminar usuario");
          } finally {
            setLoading(false);
          }
        }
      );
    },
    [refreshUsers]
  );

  // HANDLERS DE VIEW / EDIT UI
  const handleView = useCallback((u: User) => setViewingUser(u), []);
  const handleEdit = useCallback((u: EditUser) => setEditingUser(u), []);

  const closeModals = useCallback(() => {
    setIsCreateModalOpen(false);
    setEditingUser(null);
    setViewingUser(null);
  }, []);

  return {
    users,
    loading,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingUser,
    viewingUser,

    handleCreateUser,
    handleEditUser,
    handleDelete,
    handleView,
    handleEdit,

    closeModals,
  };
};
