import { useState, useEffect, useRef, useCallback } from "react";
import { showSuccess, showError } from "@/shared/utils/notifications";
import { confirmDelete } from "@/shared/utils/Delete/confirmDelete";

import {
  User,
  EditUser,
  CreateUserData,
  UsersPaginatedResult,
} from "../types/typesUser";
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
  const PAGE_SIZE = 5;
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditUser | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const sortUsers = useCallback(
    (list: User[]) => [...list].sort((a, b) => (a.userid ?? 0) - (b.userid ?? 0)),
    []
  );

  const refreshUsers = useCallback(
    async (targetPage: number = currentPage, searchText: string = search) => {
    const response = (await getUsers({
      page: targetPage,
      limit: PAGE_SIZE,
      search: searchText,
    })) as UsersPaginatedResult;

    const list = Array.isArray(response?.data) ? response.data : [];
    const meta = response?.meta;

    setUsers(sortUsers(list));
    setCurrentPage(Number(meta?.page ?? targetPage));
    setTotalPages(Math.max(1, Number(meta?.totalPages ?? 1)));

    return { list, meta };
    },
    [currentPage, search, sortUsers]
  );

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      try {
        await refreshUsers();
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        showError("Error al cargar usuarios desde el servidor");
      } finally {
        setInitialLoading(false);
      }
    };

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      load();
    }
  }, [refreshUsers]);

  const handlePageChange = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      try {
        await refreshUsers(nextPage, search);
      } catch (error) {
        console.error("Error al cambiar de página:", error);
        showError("No se pudo cargar la página de usuarios.");
      } finally {
        setLoading(false);
      }
    },
    [refreshUsers, search]
  );

  const handleSearchChange = useCallback(
    async (value: string) => {
      setSearch(value);
      setLoading(true);
      try {
        await refreshUsers(1, value);
      } catch (error) {
        console.error("Error al buscar usuarios:", error);
        showError("No se pudo buscar usuarios.");
      } finally {
        setLoading(false);
      }
    },
    [refreshUsers]
  );


  // CREAR USUARIO

  const handleCreateUser = useCallback(
    async (data: CreateUserData) => {
      setLoading(true);
      try {
        setIsCreateModalOpen(false);

        const payload = buildUserPayload(data);
        await createUser(payload);
        await refreshUsers(1, search);

        showSuccess("Usuario creado exitosamente");
      } catch (error: any) {
        console.error("Create error:", error);
        showError(error.message || "Error al crear usuario");
      } finally {
        setLoading(false);
      }
    },
    [refreshUsers, search]
  );

  // EDITAR USUARIO
  const handleEditUser = useCallback(
    async (data: EditUser) => {
      if (!data.userid) return;

      setLoading(true);
      try {
        const payload = buildUserPayload(data);
        await updateUser(data.userid, payload);
        await refreshUsers(currentPage, search);

        showSuccess("Usuario actualizado exitosamente");
        setEditingUser(null);
      } catch (error: any) {
        console.error("Update error:", error);
        showError(error.message || "Error al actualizar usuario");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, refreshUsers, search]
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
            const { list } = await refreshUsers(currentPage, search);

            if (list.length === 0 && currentPage > 1) {
              await refreshUsers(currentPage - 1, search);
            }
          } catch (error) {
            console.error("Delete error:", error);
            showError("Error al eliminar usuario");
          } finally {
            setLoading(false);
          }
        }
      );
    },
    [currentPage, refreshUsers, search]
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
    initialLoading,
    loading,
    currentPage,
    totalPages,
    pageSize: PAGE_SIZE,
    search,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingUser,
    viewingUser,

    handleCreateUser,
    handleEditUser,
    handleDelete,
    handlePageChange,
    handleSearchChange,
    handleView,
    handleEdit,

    closeModals,
  };
};
