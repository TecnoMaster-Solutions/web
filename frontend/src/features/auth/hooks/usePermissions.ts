import { useAuth } from "../authcontext";

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
  servicesrequest: "servicesrequest",

  orderservices: "orderservices",
  ordersservices: "orderservices",
  ordersservice: "orderservices",
  orderservicesmanagement: "orderservices",
  ordersservicesmanagement: "orderservices",

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
  edit: "update",
  actualizar: "update",
  editar: "update",

  delete: "delete",
  eliminar: "delete",
  borrar: "delete",

  report_warranty: "report_warranty",
  reportwarranty: "report_warranty",
  warrantyreport: "report_warranty",
  reportargarantia: "report_warranty",
};

function normalizeModule(name: string) {
  const key = (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
  return MODULE_ALIASES[key] ?? key;
}

function normalizePrivilege(name: string) {
  const key = (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return PRIVILEGE_ALIASES[key] ?? key;
}

function parsePermission(item: string) {
  const sep = item.includes(".") ? "." : item.includes("-") ? "-" : ".";
  const [module, privilege] = item.split(sep);
  return {
    module: normalizeModule(module),
    privilege: normalizePrivilege(privilege),
  };
}

function getTokenPermissions(): string[] {
  if (typeof document === "undefined") return [];
  const tokenCookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));
  if (!tokenCookie) return [];

  try {
    const token = decodeURIComponent(tokenCookie.split("=")[1] || "");
    const parts = token.split(".");
    if (parts.length !== 3) return [];
    const payloadRaw = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadRaw);
    const raw = payload?.permissions ?? payload?.permisos ?? payload?.privileges ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map((entry: any) => String(entry ?? "").trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function usePermissions() {
  const { user } = useAuth();
  const userPerms = (user as any)?.permissions || [];
  const perms = Array.isArray(userPerms) && userPerms.length ? userPerms : getTokenPermissions();

  function has(module: string, privilege: string) {
    const targetModule = normalizeModule(module);
    const targetPrivilege = normalizePrivilege(privilege);

    return perms.some((p: string) => {
      const { module: m, privilege: pv } = parsePermission(p || "");
      return m === targetModule && pv === targetPrivilege;
    });
  }

  function canView(module: string) {
    return has(module, "read");
  }

  function canCreate(module: string) {
    return has(module, "create");
  }

  function canUpdate(module: string) {
    return has(module, "update");
  }

  function canDelete(module: string) {
    return has(module, "delete");
  }

  return { has, canView, canCreate, canUpdate, canDelete };
}
