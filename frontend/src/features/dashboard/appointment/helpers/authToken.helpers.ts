const getTokenValue = (name: string) => {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return null;
  return decodeURIComponent(match.split("=")[1]);
};

const base64UrlToUtf8 = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
};

const parseTokenPayload = (token?: string | null) => {
  if (!token) return null;

  try {
    if (token.trim().startsWith("{")) return JSON.parse(token);

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = base64UrlToUtf8(parts[1]);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

type NormalizedPermission = {
  module: string;
  privilege: string;
};

const MODULE_ALIASES: Record<string, string> = {
  purchases: "purcharse",
  purcharse: "purcharse",
  compras: "purcharse",
  purchasesmanagement: "purcharse",
  purchase: "purcharse",
  ordenesdecompra: "purchaseorders",
  purchaseorders: "purchaseorders",

  categories: "categoryproducts",
  categoryproducts: "categoryproducts",
  products: "products",
  suppliers: "suppliers",

  servicesrequests: "servicesrequest",
  servicerequest: "servicesrequest",
  servicerequests: "servicesrequest",
  servicesrequest: "servicesrequest",

  orderservices: "orderservices",
  ordersservices: "orderservices",
  ordersservice: "orderservices",
  orderservicesmanagement: "orderservices",
  ordersservicesmanagement: "orderservices",
  orderservice: "orderservices",

  services: "services",
  technicians: "technicians",
  quotes: "quotes",

  costumers: "customers",
  customers: "customers",
  clients: "customers",
  users: "users",
  roles: "roles",

  sales: "sales",
  sale: "sales",
  ventas: "sales",
  venta: "sales",
  dashboard: "dashboard",
};

const PRIVILEGE_ALIASES: Record<string, string> = {
  create: "create",
  crear: "create",

  read: "read",
  ver: "read",
  leer: "read",

  update: "update",
  actualizar: "update",
  editar: "update",

  delete: "delete",
  eliminar: "delete",
  borrar: "delete",
};

const normalizeModuleName = (value?: string | null) => {
  const key = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
  return MODULE_ALIASES[key] ?? key;
};

const normalizePrivilegeName = (value?: string | null) => {
  const key = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return PRIVILEGE_ALIASES[key] ?? key;
};

const parsePermissionItem = (value?: string | null) => {
  if (!value) return { module: "", privilege: "" };
  const sep = value.includes(".") ? "." : value.includes("-") ? "-" : ".";
  const [rawModule = "", rawPrivilege = ""] = value.split(sep);
  return {
    module: normalizeModuleName(rawModule),
    privilege: normalizePrivilegeName(rawPrivilege),
  };
};

const normalizePermissionsList = (permissions?: string[] | null): NormalizedPermission[] => {
  if (!permissions?.length) return [];
  return permissions
    .map((entry) => parsePermissionItem(entry))
    .filter((entry): entry is NormalizedPermission => Boolean(entry.module && entry.privilege));
};

export const getPermissionsFromTokenCookie = () => {
  const token = getTokenValue("token");
  const payload = parseTokenPayload(token);
  const rawPermissions =
    payload?.permissions ?? payload?.permisos ?? payload?.privileges ?? [];

  if (Array.isArray(rawPermissions)) {
    return rawPermissions
      .map((entry) => (typeof entry === "string" ? entry : String(entry ?? "")))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof rawPermissions === "string") {
    return rawPermissions
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

export const hasPermissionFromToken = (
  permissions: string[] | null | undefined,
  module: string,
  privilege: string
) => {
  const normalizedPermissions = normalizePermissionsList(permissions);
  if (!normalizedPermissions.length) return false;

  const targetModule = normalizeModuleName(module);
  const targetPrivilege = normalizePrivilegeName(privilege);
  return normalizedPermissions.some(
    (perm) => perm.module === targetModule && perm.privilege === targetPrivilege
  );
};

export const normalizeRoleName = (role?: string | null) => {
  if (!role) return null;
  return role
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export const getRoleFromTokenCookie = () => {
  const token = getTokenValue("token");
  const payload = parseTokenPayload(token);
  return payload?.rolename || payload?.role || null;
};
