import { routes } from "@/shared/routes";

export type AuthzModule =
  | "dashboard"
  | "users"
  | "Roles"
  | "suppliers"
  | "purchaseOrders"
  | "purchases"
  | "products"
  | "categoryProducts"
  | "services"
  | "technicians"
  | "customers"
  | "sales"
  | "servicesRequest"
  | "orderServices"
  | "appointments"
  | "quotes"
  | "profile"
  | "settings";

export const MENU_MODULES: AuthzModule[] = [
  "dashboard",
  "users",
  "Roles",
  "suppliers",
  "purchaseOrders",
  "purchases",
  "products",
  "categoryProducts",
  "services",
  "technicians",
  "sales",
  "customers",
  "servicesRequest",
  "orderServices",
  "appointments",
  "quotes",
];

const MODULE_ALIASES: Record<string, AuthzModule> = {
  dashboard: "dashboard",

  users: "users",

  Roles: "Roles",
  roles: "Roles",

  suppliers: "suppliers",

  purchaseOrders: "purchaseOrders",

  purcharse: "purchases",
  purchasesGraph: "purchases",

  products: "products",
  categoryProducts: "categoryProducts",

  services: "services",
  technicians: "technicians",

  customers: "customers",
  clients: "customers",

  sales: "sales",

  servicesRequest: "servicesRequest",
  orderServices: "orderServices",

  appointments: "appointments",
  quotes: "quotes",

  profile: "profile",
  settings: "settings",
};

const CANONICAL_TO_PERMISSION_MODULES: Record<AuthzModule, string[]> = {
  dashboard: ["dashboard"],
  users: ["users"],
  Roles: ["Roles", "roles"],
  suppliers: ["suppliers"],
  purchaseOrders: ["purchaseOrders"],
  purchases: ["purchases", "purchasesGraph"],
  products: ["products"],
  categoryProducts: ["categoryProducts"],
  services: ["services"],
  technicians: ["technicians"],
  customers: ["customers", "clients"],
  sales: ["sales"],
  servicesRequest: ["servicesRequest"],
  orderServices: ["orderServices"],
  appointments: ["appointments"],
  quotes: ["quotes"],
  profile: ["profile"],
  settings: ["settings"],
};

export const MODULE_TO_PATH: Record<AuthzModule, string> = {
  dashboard: routes.dashboard.main,
  users: routes.dashboard.users,
  Roles: routes.dashboard.roles,
  suppliers: routes.dashboard.suppliers,
  purchaseOrders: routes.dashboard.purchasesOrders,
  purchases: routes.dashboard.purchases,
  products: routes.dashboard.products,
  categoryProducts: routes.dashboard.productsCategories,
  services: routes.dashboard.services,
  technicians: routes.dashboard.technicians,
  customers: routes.dashboard.clients,
  sales: routes.dashboard.sales,
  servicesRequest: routes.dashboard.requestsServices,
  orderServices: routes.dashboard.ordersServices,
  appointments: routes.dashboard.appointments,
  quotes: routes.dashboard.quotes,
  profile: routes.dashboard.profile,
  settings: routes.dashboard.settings,
};

export const READ_PERMISSION_TO_PATH: Record<string, string> = {
  "dashboard.read": routes.dashboard.main,

  "users.read": routes.dashboard.users,

  "Roles.read": routes.dashboard.roles,
  "roles.read": routes.dashboard.roles,

  "suppliers.read": routes.dashboard.suppliers,

  "purchaseOrders.read": routes.dashboard.purchasesOrders,

  "purcharse.read": routes.dashboard.purchases,
  "purchasesGraph.read": routes.dashboard.purchasesGraph,

  "products.read": routes.dashboard.products,
  "categoryProducts.read": routes.dashboard.productsCategories,

  "services.read": routes.dashboard.services,
  "technicians.read": routes.dashboard.technicians,

  "customers.read": routes.dashboard.clients,
  "sales.read": routes.dashboard.sales,

  "servicesRequest.read": routes.dashboard.requestsServices,
  "orderServices.read": routes.dashboard.ordersServices,

  "appointments.read": routes.dashboard.appointments,
  "quotes.read": routes.dashboard.quotes,

  "profile.read": routes.dashboard.profile,
  "settings.read": routes.dashboard.settings,
};

const DEFAULT_LANDING_PRIORITY: string[] = [
  "dashboard.read",
  "users.read",
  "products.read",
  "categoryProducts.read",
  "Roles.read",
  "services.read",
  "technicians.read",
  "appointments.read",
  "purcharse.read",
  "purchasesGraph.read",
  "purchaseOrders.read",
  "suppliers.read",
  "sales.read",
  "customers.read",
  "servicesRequest.read",
  "orderServices.read",
  "quotes.read",
  "profile.read",
  "settings.read",
];

export function normalizeModule(raw: string): AuthzModule | null {
  return MODULE_ALIASES[raw] ?? null;
}

export function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}

function routeIsWithinAnyBase(route: string, bases: string[]) {
  const cleaned = route.split("?")[0].split("#")[0];
  return bases.some((b) => cleaned === b || cleaned.startsWith(b + "/"));
}

function hasReadForCanonical(permsSet: Set<string>, canonical: AuthzModule) {
  const variants = CANONICAL_TO_PERMISSION_MODULES[canonical] ?? [canonical];
  return variants.some((m) => permsSet.has(`${m}.read`));
}

export function canViewModule(perms: string[], module: AuthzModule) {
  const set = new Set(perms || []);
  return hasReadForCanonical(set, module);
}

export function getAllowedModulesFromPermissions(perms: string[]): AuthzModule[] {
  const set = new Set(perms || []);
  const allowed: AuthzModule[] = [];

  for (const mod of MENU_MODULES) {
    if (hasReadForCanonical(set, mod)) allowed.push(mod);
  }

  return allowed;
}

export function getAccessibleBaseRoutesFromPermissions(perms: string[]): string[] {
  const bases = new Set<string>();

  for (const p of perms || []) {
    if (!p.endsWith(".read")) continue;

    const mapped = READ_PERMISSION_TO_PATH[p];
    if (mapped) {
      bases.add(mapped);
      continue;
    }

    const rawModule = p.split(".")[0]?.trim();
    const canonical = rawModule ? normalizeModule(rawModule) : null;
    if (canonical) bases.add(MODULE_TO_PATH[canonical]);
  }

  return Array.from(bases);
}

export function pickDefaultDashboardRoute(perms: string[]): string | null {
  for (const perm of DEFAULT_LANDING_PRIORITY) {
    if (perms.includes(perm)) return READ_PERMISSION_TO_PATH[perm] ?? null;
  }

  const bases = getAccessibleBaseRoutesFromPermissions(perms);
  return bases[0] ?? null;
}

export function pickPostLoginRedirect(perms: string[], nextPath?: string | null): string | null {
  const bases = getAccessibleBaseRoutesFromPermissions(perms);

  if (isSafeInternalPath(nextPath) && bases.length) {
    if (routeIsWithinAnyBase(nextPath, bases)) return nextPath;
  }

  return pickDefaultDashboardRoute(perms);
}
