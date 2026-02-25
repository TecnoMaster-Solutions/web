export type RoleUiModule =
    | "Roles"
    | "Usuarios"
    | "Categoría de Productos"
    | "Productos"
    | "Proveedores"
    | "Órdenes de Compra"
    | "Compras"
    | "Servicios"
    | "Técnicos"
    | "Clientes"
    | "Solicitud de Servicio"
    | "Citas"
    | "Cotización de Servicio"
    | "Orden de Servicio"
    | "Ventas"
    | "Dashboard";

export const ALL_MODULE_PERMISSIONS: Record<RoleUiModule, string[]> = {
    Roles: ["Crear", "Ver", "Editar", "Eliminar"],
    Usuarios: ["Crear", "Ver", "Editar", "Eliminar"],
    "Categoría de Productos": ["Crear", "Ver", "Editar", "Eliminar"],
    Productos: ["Crear", "Ver", "Editar", "Eliminar"],
    Proveedores: ["Crear", "Ver", "Editar", "Eliminar"],
    Compras: ["Crear", "Ver", "Editar", "Eliminar"],
    Servicios: ["Crear", "Ver", "Editar", "Eliminar"],
    Técnicos: ["Crear", "Ver", "Editar", "Eliminar"],
    Clientes: ["Crear", "Ver", "Editar", "Eliminar"],
    "Cotización de Servicio": ["Crear", "Ver", "Editar", "Eliminar"],

    Citas: ["Ver", "Editar", "Cancelar", "Finalizar"], // sin eliminar
    Ventas: ["Crear", "Ver", "Anular"],
    "Órdenes de Compra": ["Ver", "Enviar"],
    "Orden de Servicio": [
        "Crear",
        "Ver",
        "Editar",
        "Cancelar",
        "Agregar historial",
        "Reportar garantía",
        "Descargar reporte",
    ],
    "Solicitud de Servicio": ["Crear", "Ver", "Editar", "Cancelar"],
    Dashboard: ["Ver"],
};

export const MODULE_TO_PERMISSION_ID: Record<RoleUiModule, number> = {
    Roles: 1,
    Usuarios: 2,
    "Categoría de Productos": 3,
    Productos: 4,
    Proveedores: 5,
    "Órdenes de Compra": 6,
    Compras: 7,
    Servicios: 8,
    Técnicos: 9,
    Clientes: 10,
    "Solicitud de Servicio": 11,
    Citas: 12,
    "Cotización de Servicio": 13,
    "Orden de Servicio": 14,
    Dashboard: 15,
    Ventas: 16,
};

export const PRIVILEGE_NAME_TO_ID: Record<string, number> = {
    create: 1,
    read: 2,
    update: 3,
    delete: 4,
    deactivate: 5,
    add_history: 6,
    report_warranty: 7,
    download_report: 8,
};

export const MODULE_BACK_TO_UI: Record<string, RoleUiModule> = {
    Roles: "Roles",
    roles: "Roles",

    users: "Usuarios",
    User: "Usuarios",

    categoryProducts: "Categoría de Productos",
    Categories: "Categoría de Productos",

    products: "Productos",
    Products: "Productos",

    suppliers: "Proveedores",
    Supplier: "Proveedores",

    purchases: "Compras",
    Purchases: "Compras",

    purchaseOrders: "Órdenes de Compra",
    Orders: "Órdenes de Compra",

    services: "Servicios",
    Service: "Servicios",

    technicians: "Técnicos",
    Technician: "Técnicos",

    customers: "Clientes",
    Client: "Clientes",

    servicesRequest: "Solicitud de Servicio",
    Requests: "Solicitud de Servicio",
    "Service Request": "Solicitud de Servicio",
    "Service Requests": "Solicitud de Servicio",

    appointments: "Citas",
    Appointment: "Citas",
    Appointments: "Citas",

    quotes: "Cotización de Servicio",
    Quotes: "Cotización de Servicio",
    Quotation: "Cotización de Servicio",

    orderServices: "Orden de Servicio",
    "Service Order": "Orden de Servicio",
    "Service Orders": "Orden de Servicio",

    dashboard: "Dashboard",
    Dashboard: "Dashboard",

    sales: "Ventas",
    Sales: "Ventas",
};

export const uiActionToPrivilegeName = (module: RoleUiModule, action: string): string | null => {
    const a = action.trim().toLowerCase();

    if (module === "Orden de Servicio") {
        if (a === "agregar historial") return "add_history";
        if (a === "reportar garantía" || a === "reportar garantia") return "report_warranty";
        if (a === "descargar reporte") return "download_report";
        if (a === "cancelar") return "deactivate";
    }

    if (module === "Citas") {
        if (a === "cancelar" || a === "finalizar") return "deactivate";
    }

    if (module === "Ventas") {
        if (a === "anular") return "deactivate";
    }

    if (module === "Órdenes de Compra") {
        if (a === "enviar") return "deactivate";
    }

    if (module === "Solicitud de Servicio") {
        if (a === "cancelar") return "deactivate";
    }

    if (a === "crear") return "create";
    if (a === "ver") return "read";
    if (a === "editar") return "update";
    if (a === "eliminar") return "delete";

    return null;
};

export const privilegeNameToUiActions = (module: RoleUiModule, privName: string): string[] => {
    const p = String(privName ?? "").toLowerCase().trim();

    if (p === "create") return ["Crear"];
    if (p === "read") return ["Ver"];
    if (p === "update") return ["Editar"];
    if (p === "delete") return ["Eliminar"];

    if (p === "add_history") return ["Agregar historial"];
    if (p === "report_warranty") return ["Reportar garantía"];
    if (p === "download_report") return ["Descargar reporte"];

    if (p === "deactivate") {
        if (module === "Ventas") return ["Anular"];
        if (module === "Órdenes de Compra") return ["Enviar"];
        if (module === "Citas") return ["Cancelar", "Finalizar"];
        if (module === "Solicitud de Servicio") return ["Cancelar"];
        if (module === "Orden de Servicio") return ["Cancelar"];
        return ["Cancelar"];
    }

    return [privName];
};