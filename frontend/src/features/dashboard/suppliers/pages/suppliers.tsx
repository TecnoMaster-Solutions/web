"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import RequireAuth from "@/features/auth/requireauth";
import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";
import CreateSuppliersModal, {
  SupplierSubmitPayload,
} from "@/features/dashboard/suppliers/components/CreateSuppliersModal";
import EditSupplierModal from "@/features/dashboard/suppliers/components/EditSupplierModal";
import SupplierDetailsModal from "@/features/dashboard/suppliers/components/SupplierDetailsModal";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
} from "@/features/dashboard/suppliers/services/useSuppliers";
import type {
  SupplierDTO,
  CreateSupplierInput,
  UpdateSupplierInput,
  PaginatedResponse,
} from "@/features/dashboard/suppliers/services/suppliers.service";
import { updateSupplier as updateSupplierSvc } from "@/features/dashboard/suppliers/services/suppliers.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  showError,
  showInfo,
  showSuccess,
  showWarning,
} from "@/shared/utils/notifications";

type Row = {
  id: number;
  name: string;
  nit: string;
  rating: number;
  contact: string;
  status: "Activo" | "Inactivo";
  phone: string;
  email: string;
  address: string;
  imageUrl?: string | null;
  productos?: Array<{
    productoId: number;
    productName?: string;
    precioUnitario: number;
  }>;
};

type ApiErrorShape = {
  response?: {
    data?: {
      message?: string | string[];
      error?: string | string[];
    };
  };
  message?: string;
};

type EditSupplierPayload = SupplierSubmitPayload & { statusid: 1 | 2 };

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9998]">
      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function getErrorMessage(err: unknown) {
  const apiError = err as ApiErrorShape | null | undefined;
  const msg =
    apiError?.response?.data?.message ??
    apiError?.response?.data?.error ??
    apiError?.message;
  if (Array.isArray(msg)) return msg.join(" · ");
  if (typeof msg === "string" && msg.trim()) return msg;
  return "Ocurrió un error inesperado.";
}

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error } = useSuppliers({ page, limit, search });
  const createMut = useCreateSupplier();
  const updateMut = useUpdateSupplier(selected?.id ?? 0);
  const paginatedData = (data ?? null) as PaginatedResponse<SupplierDTO> | null;

  useEffect(() => {
    if (error) showError(getErrorMessage(error));
  }, [error]);

  const rows: Row[] = useMemo(() => {
    const list = Array.isArray(paginatedData?.data) ? paginatedData.data : [];
    return list.map((s: SupplierDTO) => ({
      id: s.supplierid,
      name: s.name,
      nit: s.nit,
      rating: s.rating ?? 0,
      contact: s.contactname,
      status: s.stateid === 1 ? "Activo" : "Inactivo",
      phone: s.phone,
      email: s.email,
      address: s.address ?? "",
      imageUrl: s.image || null,
      productos: s.productos,
    }));
  }, [paginatedData]);

  const totalPages = paginatedData?.meta?.totalPages ?? 1;

  const columns: Column<Row>[] = [
    { key: "id", header: "Id" },
    {
      key: "name",
      header: "Nombre",
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { key: "nit", header: "NIT" },
    { key: "phone", header: "Teléfono" },
    { key: "contact", header: "Contacto" },
    {
      key: "status",
      header: "Estado",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            r.status === "Activo" ? "text-green-600" : "text-green-600"
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  const searchableKeys: (keyof Row)[] = [
    "id",
    "name",
    "nit",
    "phone",
    "contact",
    "status",
  ];

  const createPending = createMut.isPending;
  const updatePending = updateMut.isPending;

  const initialLoading = isLoading;
  const tableLoading = isFetching && !isLoading;
  const busy = actionLoading || createPending || updatePending;

  const onView = (row: Row) => {
    setSelected(row);
    setOpenDetails(true);
  };

  const onEdit = (row: Row) => {
    setSelected(row);
    setOpenEdit(true);
  };

  const onDelete = async (row: Row) => {
    if (row.status === "Inactivo") return;

    const res = await Swal.fire({
      title: "¿Inactivar proveedor?",
      text: `Se marcará "${row.name}" como Inactivo (no se eliminará).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, inactivar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!res.isConfirmed) {
      showInfo("Acción cancelada.");
      return;
    }

    setActionLoading(true);
    try {
      const dto: UpdateSupplierInput = { stateid: 2 };
      await updateSupplierSvc(row.id, dto);

      setOpenDetails(false);
      setSelected(null);

      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      showSuccess("Proveedor inactivado correctamente.");
    } catch (e: unknown) {
      showError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSupplier = async (form: SupplierSubmitPayload) => {
    setActionLoading(true);
    try {
      const dto: CreateSupplierInput = {
        name: form.name.trim(),
        nit: form.nit.trim(),
        phone: form.phone?.trim() || "",
        email: form.email?.trim() || "",
        address: form.address?.trim() || "",
        stateid: 1,
        contactname: form.contactName?.trim() || "",
        image: form.imageUrl?.trim() || "",
        rating: Number(form.rating) || 0,
        productos: form.productos,
      };

      await createMut.mutateAsync(dto);
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });

      setOpenCreate(false);
      showSuccess("Proveedor creado correctamente.");
    } catch (e: unknown) {
      showError(getErrorMessage(e));
      throw e;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSupplier = async (
    form: SupplierSubmitPayload & { statusid?: 1 | 2 }
  ) => {
    if (!selected) {
      showWarning("No hay proveedor seleccionado para editar.");
      return;
    }

    setActionLoading(true);
    try {
      const stateid: 1 | 2 = form.statusid ?? (form.status === "Activo" ? 1 : 2);

      const dto: UpdateSupplierInput = {
        name: form.name?.trim(),
        nit: form.nit?.trim(),
        phone: form.phone?.trim() || "",
        email: form.email?.trim() || "",
        address: form.address?.trim() || "",
        stateid,
        contactname: form.contactName?.trim() || "",
        image: form.imageUrl?.trim() || selected.imageUrl || "",
        rating: Number(form.rating) || 0,
        productos: form.productos,
      };

      await updateMut.mutateAsync(dto);
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });

      setOpenEdit(false);
      showSuccess("Proveedor actualizado correctamente.");
    } catch (e: unknown) {
      showError(getErrorMessage(e));
      throw e;
    } finally {
      setActionLoading(false);
    }
  };

  const mapRowToEditForm = (row: Row): EditSupplierPayload => ({
    name: row.name,
    nit: row.nit,
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    contactName: row.contact ?? "",
    status: row.status,
    statusid: row.status === "Activo" ? 1 : 2,
    rating: Number(row.rating) || 0,
    imageFile: null,
    imageUrl: row.imageUrl ?? null,
    supplierid: row.id,
    productos: row.productos,
  });

  const mapRowToDetails = (row: Row) => ({
    id: row.id,
    name: row.name,
    nit: row.nit,
    phone: row.phone ?? "",
    email: row.email ?? "",
    rating: Number(row.rating) || 0,
    contactName: row.contact ?? "",
    status: row.status,
    imageUrl: row.imageUrl ?? null,
    address: row.address ?? "",
    stateid: row.status === "Activo" ? 1 : 2,
    productos: row.productos,
  });

  return (
    <RequireAuth>
      <main className="flex-1 flex flex-col bg-gray-100 relative">
        {(initialLoading || busy) && <Loader />}

        {error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-green-600">Error cargando proveedores</div>
          </div>
        ) : (
          <DataTable<Row>
            module="suppliers"
            data={rows}
            columns={columns}
            pageSize={5}
            loading={tableLoading}
            disableInternalScroll
            serverPagination={{
              page,
              limit,
              totalPages,
              onPageChange: setPage,
              onPageSizeChange: (nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              },
            }}
            serverSearch={{
              value: search,
              onChange: (value) => {
                setSearch(value);
                setPage(1);
              },
            }}
            searchPlaceholder="Buscar proveedores"
            searchableKeys={searchableKeys}
            onView={onView}
            onEdit={onEdit}
            onCancel={onDelete}
            actionGuard={(row) => {
              const isInactive = row.status === "Inactivo";
              return {
                disableCancel: isInactive,
                cancelTitle: isInactive ? "Proveedor ya inactivo" : "Anular",
              };
            }}
            onCreate={() => setOpenCreate(true)}
            createButtonText="Crear Proveedor"
          />
        )}

        <CreateSuppliersModal
          isOpen={openCreate}
          onClose={() => setOpenCreate(false)}
          onSave={handleSaveSupplier}
        />

        <EditSupplierModal
          key={selected?.id ?? "new"}
          isOpen={openEdit}
          onClose={() => setOpenEdit(false)}
          supplier={selected ? mapRowToEditForm(selected) : null}
          onSave={handleUpdateSupplier}
          title="Editar Proveedor"
        />

        <SupplierDetailsModal
          isOpen={openDetails}
          onClose={() => setOpenDetails(false)}
          supplier={selected ? mapRowToDetails(selected) : null}
          onEdit={() => {
            if (!selected) return;
            setOpenDetails(false);
            setOpenEdit(true);
          }}
          title="Detalles del Proveedor"
        />
      </main>
    </RequireAuth>
  );
}
