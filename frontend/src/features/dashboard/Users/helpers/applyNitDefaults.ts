
import { Role } from "../hooks/useRoles";
import { CreateUserData } from "../types/typesUser";


const normalizeRoleName = (name: string) =>
  (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const applyNitDefaults = (
  formData: CreateUserData,
  roles: Role[]
): CreateUserData => {

  // Si el typeid NO es NIT (id=4), devolver igual
  if (formData.typeid !== 4) {
    return formData;
  }

  // Buscar rol cliente
  const clienteRole = roles.find(
    (r) => normalizeRoleName(r.name) === "cliente"
  );

  return {
    ...formData,
    lastname: "",
    roleid: clienteRole?.roleid ?? formData.roleid,
  };
};
