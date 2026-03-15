import { IQuote } from "../types/Quote.type";

const makeQuote = (
  quotesid: number,
  clientName: string,
  createdat: string,
  total: number,
  stateName: string,
  servicetype: string,
  detailDescription: string,
): IQuote => ({
  quotesid,
  createdat,
  total,
  servicetype,
  observation: detailDescription,
  state: {
    name: stateName,
    description: stateName,
    stateid: quotesid,
  },
  customer: {
    customerid: quotesid,
    users: {
      userid: quotesid,
      name: clientName.split(" ")[0] ?? clientName,
      lastname: clientName.split(" ").slice(1).join(" "),
      email: `cliente${quotesid}@example.com`,
      phone: `3000000${String(quotesid).padStart(3, "0")}`,
    },
  },
  details: [
    {
      quotedetailid: quotesid,
      quotesid,
      productid: quotesid,
      description: detailDescription,
      quantity: 1,
      unitprice: total,
      subtotal: total,
      availability: "DISPONIBLE",
    },
  ],
});

export const quotes: IQuote[] = [
  makeQuote(
    1,
    "Pedro Pablo",
    "2025-06-07",
    2000000,
    "Aprobada",
    "MANTENIMIENTO",
    "Instalacion de camaras de seguridad en la oficina principal.",
  ),
  makeQuote(
    2,
    "Juan David Usuga",
    "2025-06-08",
    4000000,
    "Anulada",
    "INSTALACION",
    "Mantenimiento preventivo de sistemas de alarma en sucursales.",
  ),
  makeQuote(
    3,
    "Estefania Valle",
    "2025-06-09",
    250000,
    "Pendiente",
    "MANTENIMIENTO",
    "Instalacion y mantenimiento de sensores de movimiento en almacenes.",
  ),
  makeQuote(
    4,
    "Danier Alvarez",
    "2025-06-10",
    8000000,
    "Rechazada",
    "INSTALACION",
    "Instalacion de cerraduras electronicas en todas las puertas principales.",
  ),
  makeQuote(
    5,
    "Camila Rodriguez",
    "2025-06-11",
    1500000,
    "Aprobada",
    "MANTENIMIENTO",
    "Instalacion de camaras de seguridad en todas las oficinas.",
  ),
];
