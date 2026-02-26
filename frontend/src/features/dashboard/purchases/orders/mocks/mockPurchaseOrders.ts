import { purchaseOrder } from "../types/typesPurchaseOrder";

export const initialPurchaseOrders: purchaseOrder[] = [
  {
    id: 1,
    numeroOrden: "OC-2026-0001",
    proveedor: "Tecnología Avanzada S.A.S",
    fecha: "2026-02-01",
    estado: "Pendiente",
    descripcion: "Equipos de computación para oficinas",
    items: [
      { producto: "Laptop HP", cantidad: 3, precioUnitario: 2500000 },
      { producto: "Mouse Logitech", cantidad: 3, precioUnitario: 80000 }
    ],
    total: 7740000
  },
  {
    id: 2,
    numeroOrden: "OC-2026-0002",
    proveedor: "Suministros Industriales Ltda",
    fecha: "2026-02-05",
    estado: "Pendiente",
    descripcion: "Materiales eléctricos",
    items: [
      { producto: "Cableado eléctrico", cantidad: 50, precioUnitario: 15000 },
      { producto: "Interruptores", cantidad: 20, precioUnitario: 12000 }
    ],
    total: 990000
  },
  {
    id: 3,
    numeroOrden: "OC-2026-0003",
    proveedor: "Servicios Logísticos Colombia",
    fecha: "2026-02-10",
    estado: "Pendiente",
    descripcion: "Servicio de transporte especializado",
    items: [
      { producto: "Transporte Bogotá - Medellín", cantidad: 2, precioUnitario: 850000 }
    ],
    total: 1700000
  },
  {
    id: 4,
    numeroOrden: "OC-2026-0004",
    proveedor: "Diana Inguia",
    fecha: "2026-02-15",
    estado: "Pendiente",
    descripcion: "Instalación de sistema electrónico",
    items: [
      { producto: "Panel de control", cantidad: 1, precioUnitario: 3100000 },
      { producto: "Cableado estructurado", cantidad: 1, precioUnitario: 450000 }
    ],
    total: 3550000
  }
];