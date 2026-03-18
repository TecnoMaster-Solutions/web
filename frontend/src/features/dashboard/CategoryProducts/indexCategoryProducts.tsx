"use client";
import Colors from "@/shared/theme/colors";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DataTable } from "../components/datatable/DataTable";
import EditCategoryModal from "./components/EditCategoryModal/EditCategory";
import ViewCategoryModal from "./components/ViewCategoryModal/ViewCategory";
import CreateCategoryModal from "./components/CreateCategoryModal/CreateCategory";
import { useCategories } from "./hooks/useCategories";
import { Category, EditCategoryData } from "./types/typeCategoryProducts";
import { Column } from "../components/datatable/types/column.types";

type CategoryTableRow = Category & {
  rowNumber: number;
  statusSearch: string;
  productsCount: number;
};

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function CategoriesPage() {
  const {
    categories,
    pagedCategories,
    categoryProductCounts,
    initialLoading,
    loading,
    currentPage,
    totalPages,
    pageSize,
    search,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingCategory,
    viewingCategory,
    handleCreateCategory,
    handleEditCategory,
    handleView,
    handleEdit,
    handleDeleteCategory,
    handlePageChange,
    handleSearchChange,
    closeModals,
  } = useCategories();

  const columns: Column<CategoryTableRow>[] = [
    { key: "id", header: "ID" },
    { key: "name", header: "Nombre" },
    {
      key: "description",
      header: "Descripcion",
      render: (row: CategoryTableRow) => {
        const desc =
          row.description && row.description.trim() !== ""
            ? row.description
            : "No hay descripcion";

        const maxLength = 60;
        const truncated =
          desc.length > maxLength ? desc.substring(0, maxLength) + "..." : desc;

        return (
          <div
            title={desc}
            className="flex justify-center items-center text-center w-full h-full"
          >
            <span
              className={`block max-w-[250px] truncate ${
                desc === "No hay descripcion" ? "text-gray-400 italic" : "text-gray-700"
              }`}
            >
              {truncated}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (row: CategoryTableRow) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            color: row.status ? Colors.states.success : Colors.states.inactive,
          }}
        >
          {row.status ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const categoriesWithCounts = pagedCategories.map((category) => ({
    ...category,
    productsCount: categoryProductCounts[category.id] ?? 0,
  }));

  const categoriesForTable = [...categoriesWithCounts]
    .sort((a, b) => a.id - b.id)
    .map((c, index) => ({
      ...c,
      rowNumber: (currentPage - 1) * pageSize + index + 1,
      statusSearch: c.status ? "activo" : "inactivo",
    }));

  return (
    <div className="min-h-screen flex">
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

      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex flex-col">
          <div className="flex-1 px-6 py-6">
            <CreateCategoryModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onSave={handleCreateCategory}
              categories={categories}
            />

            <EditCategoryModal
              isOpen={!!editingCategory}
              category={editingCategory}
              onClose={closeModals}
              onSave={(categoryData: EditCategoryData) => {
                if (editingCategory) {
                  return handleEditCategory(editingCategory.id, categoryData);
                }
                return Promise.resolve();
              }}
              categories={categories}
            />

            <ViewCategoryModal
              isOpen={!!viewingCategory}
              category={viewingCategory}
              onClose={closeModals}
            />

            {initialLoading ? (
              <Loader />
            ) : (
              <DataTable<CategoryTableRow>
                module="categories"
                data={categoriesForTable}
                columns={columns}
                pageSize={pageSize}
                showPageSizeSelector={false}
                serverPagination={{
                  page: currentPage,
                  totalPages,
                  onPageChange: handlePageChange,
                }}
                serverSearch={{
                  value: search,
                  onChange: handleSearchChange,
                }}
                searchableKeys={["id", "name", "description", "statusSearch"]}
                onCreate={() => setIsCreateModalOpen(true)}
                createButtonText="Crear Categoria"
                searchPlaceholder="Buscar categorias..."
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteCategory}
                actionGuard={(row) => {
                  const count = row.productsCount ?? 0;
                  if (count === 0) {
                    return {};
                  }

                  return {
                    disableDelete: true,
                    deleteTitle:
                      count === 1
                        ? "No se puede eliminar: la categoria tiene 1 producto asociado"
                        : `No se puede eliminar: la categoria tiene ${count} productos asociados`,
                  };
                }}
                loading={loading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
