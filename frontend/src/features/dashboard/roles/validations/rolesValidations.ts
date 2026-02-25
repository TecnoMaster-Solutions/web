import { Role, CreateRoleData } from "@/features/dashboard/roles/types/typeRoles";

export interface RoleErrors {
  name?: string;
  permissions?: string;
}

export const validateRoleField = (
  field: keyof CreateRoleData,
  value: any,
  roles: Role[],
  excludeId?: number
): string | undefined => {
  switch (field) {
    case "name":
      if (!String(value).trim()) return "El nombre del rol es obligatorio";
      if (
        roles.some(
          (r) =>
            r.name.trim().toLowerCase() === String(value).trim().toLowerCase() &&
            r.id !== excludeId
        )
      ) {
        return "Ya existe un rol con este nombre";
      }
      return;

    case "permissions":
      if (!Array.isArray(value) || value.length === 0)
        return "Debe seleccionar al menos un permiso";
      return;

    default:
      return;
  }
};

export const validateRoleForm = (
  data: Partial<CreateRoleData> & { id?: number },
  roles: Role[],
  excludeId?: number
): RoleErrors => {
  const errors: RoleErrors = {};

  const fields: (keyof RoleErrors)[] = ["name", "permissions"];

  fields.forEach((field) => {
    const error = validateRoleField(
      field as keyof CreateRoleData,
      (data as any)[field],
      roles,
      excludeId
    );
    if (error) errors[field] = error;
  });

  return errors;
};
