import { apiClient } from "@/shared/utils/apiClient";
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  getSupplierProducts,
  listSuppliers,
  updateSupplier,
} from "@/features/dashboard/suppliers/services/suppliers.service";

jest.mock("@/shared/utils/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const resolved = <T,>(value: T) => value;

describe("suppliers.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listSuppliers devuelve lista simple cuando no recibe paginacion", async () => {
    const suppliers = [{ supplierid: 1, name: "Proveedor Uno" }];
    mockedApiClient.get.mockResolvedValue(resolved({ data: suppliers }));

    await expect(listSuppliers()).resolves.toEqual(suppliers);
    expect(mockedApiClient.get).toHaveBeenCalledWith("/suppliers", {
      params: {
        page: undefined,
        limit: undefined,
        search: undefined,
        stateid: undefined,
      },
    });
  });

  it("listSuppliers devuelve respuesta paginada cuando recibe page y limit", async () => {
    const paginated = {
      data: [{ supplierid: 2, name: "Proveedor Dos" }],
      meta: {
        page: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
    mockedApiClient.get.mockResolvedValue(resolved(paginated));

    await expect(
      listSuppliers({ page: 1, limit: 5, search: "  proveedor  ", stateid: 1 }),
    ).resolves.toEqual(paginated);
    expect(mockedApiClient.get).toHaveBeenCalledWith("/suppliers", {
      params: {
        page: 1,
        limit: 5,
        search: "proveedor",
        stateid: 1,
      },
    });
  });

  it("getSupplier desempaqueta la respuesta del backend", async () => {
    const supplier = { supplierid: 3, name: "Proveedor Tres" };
    mockedApiClient.get.mockResolvedValue(resolved({ data: supplier }));

    await expect(getSupplier(3)).resolves.toEqual(supplier);
    expect(mockedApiClient.get).toHaveBeenCalledWith("/suppliers/3");
  });

  it("createSupplier envia el payload y devuelve el proveedor creado", async () => {
    const payload = {
      name: "Proveedor Nuevo",
      nit: "900123",
      phone: "+573001112233",
      email: "nuevo@test.com",
      address: "Calle 1",
      stateid: 1,
      contactname: "Ana",
      image: "https://example.com/image.png",
      rating: 5,
    };
    const created = { supplierid: 4, ...payload };
    mockedApiClient.post.mockResolvedValue(resolved({ data: created }));

    await expect(createSupplier(payload)).resolves.toEqual(created);
    expect(mockedApiClient.post).toHaveBeenCalledWith("/suppliers", payload);
  });

  it("updateSupplier envia id y cambios parciales", async () => {
    const changes = { name: "Proveedor Editado", rating: 4 };
    const updated = { supplierid: 4, ...changes };
    mockedApiClient.patch.mockResolvedValue(resolved({ data: updated }));

    await expect(updateSupplier(4, changes)).resolves.toEqual(updated);
    expect(mockedApiClient.patch).toHaveBeenCalledWith("/suppliers/4", changes);
  });

  it("deleteSupplier llama el endpoint de eliminacion", async () => {
    mockedApiClient.delete.mockResolvedValue(resolved(undefined));

    await expect(deleteSupplier(9)).resolves.toBeUndefined();
    expect(mockedApiClient.delete).toHaveBeenCalledWith("/suppliers/9");
  });

  it("getSupplierProducts devuelve los productos asociados", async () => {
    const products = [
      {
        id: 10,
        productName: "Router",
        precioUnitario: 1200,
        image: "https://example.com/router.png",
      },
    ];
    mockedApiClient.get.mockResolvedValue(resolved({ data: products }));

    await expect(getSupplierProducts(5)).resolves.toEqual(products);
    expect(mockedApiClient.get).toHaveBeenCalledWith("/suppliers/5/products");
  });
});
