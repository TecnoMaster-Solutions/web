import { IPurchaseGraph } from "../Types/PurchaseGraph.type";

export const purchasesGraphMock: IPurchaseGraph[] = [
  { id: 1, top: 1, supplier: "Proveedor A", total: "$1,200.50", quantity: 5 },
  { id: 2, top: 2, supplier: "Proveedor B", total: "$950.00", quantity: 3 },
  { id: 3, top: 3, supplier: "Proveedor C", total: "$870.75", quantity: 4 },
  { id: 4, top: 4, supplier: "Proveedor D", total: "$650.25", quantity: 2 },
  { id: 5, top: 5, supplier: "Proveedor E", total: "$430.00", quantity: 1 },
  { id: 6, top: 6, supplier: "Proveedor F", total: "$780.50", quantity: 3 },
];
