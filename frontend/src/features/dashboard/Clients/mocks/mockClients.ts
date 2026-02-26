// mocks/mockClients.ts

import { Client } from "../types/typeClients";

export const initialClients: Client[] = [
  {
    id: 1,
    tipo: "CC",
    documento: "1021086280",
    nombre: "Joao Estid",
    apellido: "Ortiz Cuello",
    telefono: "3008239274",
    correoElectronico: "joaoestid@gmail.com",
    estado: "Inactivo",
    ciudad: "Medellín",
    codigoPostal: "050001",
  },
  {
    id: 2,
    tipo: "PPT",
    documento: "1221106280",
    nombre: "Samuel",
    apellido: "Cordoba",
    telefono: "3113369669",
    correoElectronico: "sami69@gmail.com",
    estado: "Activo",
    ciudad: "Bogotá",
    codigoPostal: "110111",
  },
  {
    id: 3,
    tipo: "CC",
    documento: "1221302283",
    nombre: "Daniel",
    apellido: "Alvarez",
    telefono: "3016242087",
    correoElectronico: "negrito88@gmail.com",
    estado: "Inactivo",
    ciudad: "Cali",
    codigoPostal: "760001",
  },
];