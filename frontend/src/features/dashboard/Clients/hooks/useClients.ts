"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getClients,
  deleteClient,
} from "../api/clients.api";
import { createUser, updateUser } from "@/features/dashboard/Users/connection/userApi";
import { api } from "@/shared/utils/apiClient";

import {
  Client,
  ClientsPaginatedResult,
  CreateClientData,
  EditClientData,
  ClientFormErrors,
  ClientFormTouched,
} from "../types/typeClients";

import { showSuccess, showError } from "@/shared/utils/notifications";
import { getApiErrorMessage } from "@/features/auth/utils/authUser";

const MIN_LOADER_MS = 450;

// ── Mapa de estados
const stateMap: Record<string, number> = {
  Activo: 1,
  Inactivo: 2,
};

let cachedClientRoleId: number | null = null;

type RoleSummary = {
  roleid?: number;
  id?: number;
  name?: string;
};

type ApiErrorShape = {
  name?: string;
  code?: string;
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const getClientRoleId = async (): Promise<number> => {
  if (cachedClientRoleId) return cachedClientRoleId;

  const { data } = await api.get("/roles/list");
  const roles = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.roles)
        ? data.roles
        : [];

  const clientRole = roles.find(
    (role: RoleSummary) => normalizeText(String(role?.name ?? "")) === "cliente"
  );
  const roleId = Number(clientRole?.roleid ?? clientRole?.id);

  if (!Number.isFinite(roleId) || roleId <= 0) {
    throw new Error("No se encontró el rol de cliente.");
  }

  cachedClientRoleId = roleId;
  return roleId;
};

// ── Validaciones exhaustivas ─────────────────────────────────────────────────

const ONLY_LETTERS = /^[A-Za-záéíóúÁÉÍÓÚñÑ\s'-]+$/;
const ONLY_NUMBERS = /^\d+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_SPECIAL_CHARS = /[@,.;:_\{\[\}^\]`+*~Â¡Â¿?\\'=)(/&%$#"|<>]/;

export function validateClientData(
  data: CreateClientData | EditClientData
): ClientFormErrors {
  const errors: ClientFormErrors = {};

  if (!data.tipo || data.tipo === 0) {
    errors.tipo = "Seleccione tipo de documento";
  }

  if (!data.documento?.trim()) {
    errors.documento = "Documento obligatorio";
  } else if (!ONLY_NUMBERS.test(data.documento.trim())) {
    errors.documento = "El documento solo puede contener números";
  } else if (data.documento.trim().length < 5) {
    errors.documento = "El documento debe tener al menos 5 dígitos";
  }

  if (!data.nombre?.trim()) {
    errors.nombre = "Nombre obligatorio";
  } else if (!ONLY_LETTERS.test(data.nombre.trim())) {
    errors.nombre = "El nombre solo puede contener letras";
  }

  if (!data.apellido?.trim()) {
    errors.apellido = "Apellido obligatorio";
  } else if (!ONLY_LETTERS.test(data.apellido.trim())) {
    errors.apellido = "El apellido solo puede contener letras";
  }

  if (!data.telefono?.trim()) {
    errors.telefono = "Teléfono obligatorio";
  } else if (!ONLY_NUMBERS.test(data.telefono.trim())) {
    errors.telefono = "El teléfono solo puede contener números";
  } else if (data.telefono.trim().length < 7) {
    errors.telefono = "El teléfono debe tener al menos 7 dígitos";
  }

  if (!data.correoElectronico?.trim()) {
    errors.correoElectronico = "Correo obligatorio";
  } else if (!EMAIL_RE.test(data.correoElectronico.trim())) {
    errors.correoElectronico = "Formato de correo inválido";
  }

  if (!data.ciudad?.trim()) {
    errors.ciudad = "Ciudad obligatoria";
  } else if (!ONLY_LETTERS.test(data.ciudad.trim())) {
    errors.ciudad = "La ciudad solo puede contener letras";
  }

  if (!data.codigoPostal?.trim()) {
    errors.codigoPostal = "Código postal obligatorio";
  } else if (!ONLY_NUMBERS.test(data.codigoPostal.trim())) {
    errors.codigoPostal = "El código postal solo puede contener números";
  }

  return errors;
}

function validateCreateClientField(
  field: keyof CreateClientData,
  value: string | number,
  formData: CreateClientData,
  clients: Client[]
): string {
  const rawValue = String(value ?? "");
  const trimmedValue = rawValue.trim();
  const normalizedValue = trimmedValue.toLowerCase();

  switch (field) {
    case "tipo":
      return Number(value) > 0 ? "" : "El tipo de documento es obligatorio";

    case "documento":
      if (!trimmedValue) return "El número de documento es obligatorio";
      if (!ONLY_NUMBERS.test(trimmedValue)) {
        return "El documento solo puede contener números";
      }
      if (trimmedValue.length > 10) {
        return "El número de documento no puede tener más de 10 caracteres";
      }
      if (
        clients.some(
          (client) =>
            String(client.documento ?? "").trim().toLowerCase() === normalizedValue
        )
      ) {
        return "Ya existe un usuario con este número de documento";
      }
      return "";

    case "nombre":
      if (!trimmedValue) return "El nombre es obligatorio";
      if (/[0-9]/.test(trimmedValue)) return "El nombre no puede contener números";
      if (USER_SPECIAL_CHARS.test(trimmedValue)) {
        return "El nombre no puede contener caracteres especiales";
      }
      return "";

    case "apellido":
      if (!trimmedValue) return "El apellido es obligatorio";
      if (/[0-9]/.test(trimmedValue)) return "El apellido no puede contener números";
      if (USER_SPECIAL_CHARS.test(trimmedValue)) {
        return "El apellido no puede contener caracteres especiales";
      }
      return "";

    case "telefono":
      if (!trimmedValue) return "El teléfono es obligatorio";
      if (!ONLY_NUMBERS.test(trimmedValue)) {
        return "El teléfono solo puede contener números";
      }
      if (trimmedValue.length !== 10) {
        return "El teléfono debe tener exactamente 10 dígitos";
      }
      if (clients.some((client) => String(client.telefono ?? "").trim() === trimmedValue)) {
        return "Ya existe un usuario con este número de teléfono";
      }
      return "";

    case "correoElectronico":
      if (!trimmedValue) return "El correo electrónico es obligatorio";
      if (!EMAIL_RE.test(trimmedValue)) return "El formato del correo no es válido";
      if (
        clients.some(
          (client) =>
            String(client.correoElectronico ?? "").trim().toLowerCase() === normalizedValue
        )
      ) {
        return "Ya existe un usuario con este correo electrónico";
      }
      return "";

    case "ciudad":
      return trimmedValue ? "" : "La ciudad es obligatoria para clientes";

    case "codigoPostal":
      if (!trimmedValue) return "El código postal es obligatorio para clientes";
      if (!ONLY_NUMBERS.test(trimmedValue)) {
        return "El código postal debe contener solo números";
      }
      return "";

    case "estado":
      return "";

    default:
      return "";
  }
}

function validateCreateClientForm(
  formData: CreateClientData,
  clients: Client[]
): ClientFormErrors {
  return {
    tipo: validateCreateClientField("tipo", formData.tipo, formData, clients),
    documento: validateCreateClientField("documento", formData.documento, formData, clients),
    nombre: validateCreateClientField("nombre", formData.nombre, formData, clients),
    apellido: validateCreateClientField("apellido", formData.apellido, formData, clients),
    telefono: validateCreateClientField("telefono", formData.telefono, formData, clients),
    correoElectronico: validateCreateClientField(
      "correoElectronico",
      formData.correoElectronico,
      formData,
      clients
    ),
    ciudad: validateCreateClientField("ciudad", formData.ciudad, formData, clients),
    codigoPostal: validateCreateClientField(
      "codigoPostal",
      formData.codigoPostal,
      formData,
      clients
    ),
  };
}

function validateEditClientField(
  field: keyof CreateClientData,
  value: string | number,
  formData: EditClientData,
  clients: Client[]
): string {
  const baseError = validateCreateClientField(
    field,
    value,
    formData,
    clients.filter((client) => client.id !== formData.id)
  );

  if (field === "estado") {
    return String(value ?? "").trim() ? "" : "Seleccione un estado";
  }

  return baseError;
}

function validateEditClientForm(
  formData: EditClientData,
  clients: Client[]
): ClientFormErrors {
  return {
    tipo: validateEditClientField("tipo", formData.tipo, formData, clients),
    documento: validateEditClientField("documento", formData.documento, formData, clients),
    nombre: validateEditClientField("nombre", formData.nombre, formData, clients),
    apellido: validateEditClientField("apellido", formData.apellido, formData, clients),
    telefono: validateEditClientField("telefono", formData.telefono, formData, clients),
    correoElectronico: validateEditClientField(
      "correoElectronico",
      formData.correoElectronico,
      formData,
      clients
    ),
    estado: validateEditClientField("estado", formData.estado, formData, clients),
    ciudad: validateEditClientField("ciudad", formData.ciudad, formData, clients),
    codigoPostal: validateEditClientField(
      "codigoPostal",
      formData.codigoPostal,
      formData,
      clients
    ),
  };
}

// =====================================================
// MAIN HOOK
// =====================================================

export function useClients() {
  const PAGE_SIZE = 5;
  const SEARCH_DEBOUNCE_MS = 350;

  const [clients, setClients] = useState<Client[]>([]);
  const [pagedClients, setPagedClients] = useState<Client[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const hasFetchedRef = useRef(false);
  const pageAbortRef = useRef<AbortController | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const startRef = useRef(0);

  const startLoading = () => {
    busyRef.current = true;
    startRef.current = Date.now();
    setLoading(true);
  };

  const stopLoading = () => {
    const elapsed = Date.now() - startRef.current;
    const remaining = MIN_LOADER_MS - elapsed;

    if (remaining > 0) {
      setTimeout(() => {
        busyRef.current = false;
        setLoading(false);
      }, remaining);
    } else {
      busyRef.current = false;
      setLoading(false);
    }
  };

  const withLoading = async (fn: () => Promise<void>) => {
    if (busyRef.current) return;
    startLoading();
    try {
      await fn();
    } catch (error: unknown) {
      const apiError = error as ApiErrorShape;
      console.error("Hook Error:", error);
      const msg = apiError.response?.data?.message ?? getApiErrorMessage(error, "Ocurrio un error inesperado.");
      showError(Array.isArray(msg) ? msg[0] : msg);
      throw error; // Re-lanzar para que el flujo externo sepa que falló
    } finally {
      stopLoading();
    }
  };

  const normalizeClientList = useCallback((list: Client[]): Client[] => {
    return list.map((c) => ({
      ...c,
      tipoId: (c as Client & { tipoId?: number }).tipoId ?? 0,
    }));
  }, []);

  const loadAllClients = useCallback(async () => {
    const data = (await getClients()) as Client[];
    setClients(normalizeClientList(data));
  }, [normalizeClientList]);

  const loadClientsPage = useCallback(
    async (targetPage: number, searchText: string, signal?: AbortSignal) => {
      const response = (await getClients({
        page: targetPage,
        limit: PAGE_SIZE,
        search: searchText,
        signal,
      })) as ClientsPaginatedResult;

      const list = Array.isArray(response?.data) ? response.data : [];
      const meta = response?.meta;

      setPagedClients(normalizeClientList(list));
      setCurrentPage(Number(meta?.page ?? targetPage));
      setTotalPages(Math.max(1, Number(meta?.totalPages ?? 1)));
      return { list, meta };
    },
    [normalizeClientList],
  );

  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      setLoading(true);
      try {
        await Promise.all([loadClientsPage(1, ""), loadAllClients()]);
      } catch (error: any) {
        console.error("Error cargando clientes:", error);
        const msg = error?.response?.data?.message || "No se pudieron cargar los clientes.";
        showError(Array.isArray(msg) ? msg[0] : msg);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    };

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void load();
    }
  }, [loadAllClients, loadClientsPage]);

  const loadAllClients = useCallback(async () => {
    const data = await getClients();
    const mapped: Client[] = data.map((client) => ({
      ...client,
      tipoId: client.tipoId ?? 0,
    }));
    setClients(mapped);
    return mapped;
  }, []);

  const loadClientsPage = useCallback(
    async (
      page: number,
      searchText: string,
      signal?: AbortSignal,
    ): Promise<{ list: Client[]; meta: ClientsPaginatedResult["meta"] }> => {
      const response = (await getClients({
        page,
        limit: PAGE_SIZE,
        search: searchText,
        signal,
      })) as ClientsPaginatedResult;

      const list = Array.isArray(response.data)
        ? response.data.map((client) => ({
            ...client,
            tipoId: client.tipoId ?? 0,
          }))
        : [];
      const meta = response.meta;

      setPagedClients(list);
      setCurrentPage(Number(meta?.page ?? page));
      setTotalPages(Math.max(1, Number(meta?.totalPages ?? 1)));

      return { list, meta };
    },
    [PAGE_SIZE],
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([loadClientsPage(1, ""), loadAllClients()]);
      } catch (error: unknown) {
        console.error("Error al cargar clientes:", error);
        showError(getApiErrorMessage(error, "No se pudieron cargar los clientes."));
      } finally {
        setInitialLoading(false);
      }
    };

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void loadInitialData();
    }
  }, [loadAllClients, loadClientsPage]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      pageAbortRef.current?.abort();
      searchAbortRef.current?.abort();
    };
  }, []);

  const handlePageChange = useCallback(
    async (nextPage: number) => {
      pageAbortRef.current?.abort();
      const controller = new AbortController();
      pageAbortRef.current = controller;

      setLoading(true);
      try {
        await loadClientsPage(nextPage, search, controller.signal);
      } catch (error: unknown) {
        const apiError = error as ApiErrorShape;
        if (
          apiError.name === "CanceledError" ||
          apiError.code === "ERR_CANCELED" ||
          controller.signal.aborted
        ) {
          return;
        }
        console.error("Error al cambiar de pagina en clientes:", error);
        const msg = apiError.response?.data?.message ?? getApiErrorMessage(error, "No se pudo cargar la pagina de clientes.");
        showError(Array.isArray(msg) ? msg[0] : msg);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [loadClientsPage, search],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      pageAbortRef.current?.abort();
      searchAbortRef.current?.abort();

      const controller = new AbortController();
      searchAbortRef.current = controller;

      searchDebounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          await loadClientsPage(1, value, controller.signal);
        } catch (error: unknown) {
          const apiError = error as ApiErrorShape;
          if (
            apiError.name === "CanceledError" ||
            apiError.code === "ERR_CANCELED" ||
            controller.signal.aborted
          ) {
            return;
          }
          console.error("Error al buscar clientes:", error);
          const msg = apiError.response?.data?.message ?? getApiErrorMessage(error, "No se pudieron buscar los clientes.");
          showError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }, SEARCH_DEBOUNCE_MS);
    },
    [loadClientsPage],
  );

  // ── CREATE CLIENT ──────────────────────────────────────────────────────────
  const handleCreateClient = async (form: CreateClientData): Promise<boolean> => {
    const clientRoleId = await getClientRoleId();
    const payload = {
      name: form.nombre.trim(),
      lastname: form.apellido.trim(),
      email: form.correoElectronico.trim(),
      documentnumber: form.documento.trim(),
      phone: form.telefono.replace(/\D/g, ""), // ← solo dígitos para evitar 400 por regex
      typeid: Number(form.tipo),
      stateid: stateMap[form.estado] ?? 1,
      roleid: clientRoleId,
      customercity: form.ciudad.trim(),
      customerzipcode: form.codigoPostal.trim(),
      image: "", // imagen vacía por defecto (campo requerido por backend)
    };

    try {
      await withLoading(async () => {
        await createUser(payload);
        showSuccess("Cliente creado exitosamente.");
      });

      await Promise.all([loadClientsPage(1, search), loadAllClients()]);
      return true;
    } catch {
      return false;
    }
  };

  // ── EDIT CLIENT ────────────────────────────────────────────────────────────
  const handleEditClient = async (form: EditClientData): Promise<void> => {
    const currentClient = clients.find((client) => client.id === form.id);
    if (!currentClient?.userid) {
      showError("No se encontró el usuario asociado al cliente.");
      return;
    }

    const clientRoleId = await getClientRoleId();

    const userPayload = {
      name: form.nombre.trim(),
      lastname: form.apellido.trim(),
      email: form.correoElectronico.trim(),
      documentnumber: form.documento.trim(),
      phone: form.telefono.replace(/\D/g, ""),
      typeid: Number(form.tipo),
      stateid: stateMap[form.estado] ?? 1,
      roleid: clientRoleId,
      image: "",
      customercity: form.ciudad.trim(),
      customerzipcode: form.codigoPostal.trim(),
    };

    try {
      await withLoading(async () => {
        await updateUser(currentClient.userid, userPayload);
        showSuccess("Cliente actualizado correctamente.");
      });

      await Promise.all([loadClientsPage(currentPage, search), loadAllClients()]);
    } catch {
      return;
    } finally {
      setEditingClient(null);
    }
  };

  // ── DELETE CLIENT ──────────────────────────────────────────────────────────
  const handleDeleteClient = async (id: number) => {
    let deleted = false;

    await withLoading(async () => {
      try {
        await deleteClient(id);
        deleted = true;
        showSuccess("Cliente eliminado correctamente.");
      } catch (err: unknown) {
        // Extraer detalles del error de Axios
        const axiosErr = err as {
          response?: { status?: number; data?: { message?: string | string[] } };
        };
        const status = axiosErr?.response?.status;
        const rawMsg = axiosErr?.response?.data?.message;
        const message = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;

        if (status === 409) {
          showError(
            message ||
            "No se puede eliminar el cliente porque tiene ventas activas."
          );
        } else if (status === 404) {
          showError("El cliente no fue encontrado.");
        } else {
          showError("Error al eliminar el cliente.");
        }
        // NO re-lanzamos → withLoading termina limpiamente sin propagar
      }
    });

    // Solo recargar si realmente se borró
    if (deleted) {
      const activeSearch = search.trim();
      if (activeSearch) {
        setSearch("");
        await loadClientsPage(1, "");
      } else {
        const { list } = await loadClientsPage(currentPage, search);
        if (list.length === 0 && currentPage > 1) {
          await loadClientsPage(currentPage - 1, search);
        }
      }
      await loadAllClients();
    }
  };

  const handleView = (client: Client) => {
    setViewingClient(client);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setEditingClient(null);
    setViewingClient(null);
  };

  return {
    clients,
    pagedClients,
    initialLoading,
    loading,
    currentPage,
    totalPages,
    pageSize: PAGE_SIZE,
    search,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingClient,
    viewingClient,
    handleCreateClient,
    handleEditClient,
    handleDeleteClient,
    handlePageChange,
    handleSearchChange,
    handleView,
    handleEdit,
    closeModals,
  };
}

// =====================================================
// CREATE CLIENT FORM HOOK
// =====================================================

interface UseCreateClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateClientData) => Promise<boolean>;
  clients: Client[];
}

export function useCreateClientForm({
  isOpen,
  onClose,
  onSave,
  clients,
}: UseCreateClientFormProps) {
  const initialState = useMemo<CreateClientData>(
    () => ({
      tipo: 0,
      documento: "",
      nombre: "",
      apellido: "",
      telefono: "",
      correoElectronico: "",
      ciudad: "",
      codigoPostal: "",
      estado: "",
    }),
    [],
  );

  const [formData, setFormData] = useState<CreateClientData>(initialState);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [touched, setTouched] = useState<ClientFormTouched>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialState);
      setErrors({});
      setTouched({});
    }
  }, [initialState, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const nextFormData = {
      ...formData,
      [name]: name === "tipo" ? Number(value) : value,
    };

    setFormData(nextFormData);
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateCreateClientField(
        name as keyof CreateClientData,
        name === "tipo" ? Number(value) : value,
        nextFormData,
        clients
      ),
    }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateCreateClientField(
        name as keyof CreateClientData,
        formData[name as keyof CreateClientData] ?? "",
        formData,
        clients
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCreateClientForm(formData, clients);
    setErrors(validationErrors);

    // Marcar todos como tocados para mostrar errores
    const allTouched: ClientFormTouched = {};
    (Object.keys(formData) as Array<keyof CreateClientData>).forEach(
      (k) => (allTouched[k] = true)
    );
    setTouched(allTouched);

    if (Object.values(validationErrors).some(Boolean)) {
      showError("Por favor complete los campos correctamente");
      return;
    }

    onClose();
    await onSave(formData);
  };

  return {
    formData,
    setFormData,
    errors,
    touched,
    handleInputChange,
    handleBlur,
    handleSubmit,
  };
}

// =====================================================
// EDIT CLIENT FORM HOOK
// =====================================================

interface UseEditClientFormProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (data: EditClientData) => Promise<void> | void;
  clients: Client[];
}

export function useEditClientForm({
  isOpen,
  client,
  onClose,
  onSave,
  clients,
}: UseEditClientFormProps) {
  const [formData, setFormData] = useState<EditClientData | null>(null);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [touched, setTouched] = useState<ClientFormTouched>({});

  useEffect(() => {
    if (isOpen && client) {
      setFormData({
        id: client.id,
        nombre: client.nombre,
        apellido: client.apellido,
        // Usar tipoId (número) para que el select quede preseleccionado
        tipo: client.tipoId || 0,
        documento: client.documento,
        telefono: client.telefono,
        correoElectronico: client.correoElectronico,
        estado: client.estado,
        ciudad: client.ciudad,
        codigoPostal: client.codigoPostal,
      });

      setErrors({});
      setTouched({});
    }
  }, [isOpen, client]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    const nextFormData = {
      ...formData,
      [name]: name === "tipo" ? Number(value) : value,
    };
    setFormData(nextFormData);
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateEditClientField(
        name as keyof CreateClientData,
        name === "tipo" ? Number(value) : value,
        nextFormData,
        clients
      ),
    }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (formData) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateEditClientField(
          name as keyof CreateClientData,
          formData[name as keyof EditClientData] ?? "",
          formData,
          clients
        ),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const validationErrors = validateEditClientForm(formData, clients);
    setErrors(validationErrors);

    const allTouched: ClientFormTouched = {};
    (Object.keys(formData) as Array<keyof EditClientData>).forEach(
      (k) => (allTouched[k as keyof ClientFormTouched] = true)
    );
    setTouched(allTouched);

    if (Object.values(validationErrors).some(Boolean)) {
      showError("Por favor complete los campos correctamente");
      return;
    }

    try {
      onClose();
      await onSave(formData);
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
    }
  };

  return {
    formData,
    setFormData,
    errors,
    touched,
    handleInputChange,
    handleBlur,
    handleSubmit,
  };
}

