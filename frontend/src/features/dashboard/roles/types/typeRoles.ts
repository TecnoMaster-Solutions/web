export type Role = {
  id: number;
  name: string;
  state: "Activo" | "Inactivo";
  permissions?: string[];
};

export type CreateRoleData = {
  name: string;
  permissions: string[];
};

export type EditRoleData = {
  id: number;
  name: string;
  state: "Activo" | "Inactivo";
  permissions?: string[];
};

export type PermissionGroup = {
  title: string;
  permissions: string[];
};

export interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRoleData) => void;
}

export interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: EditRoleData) => void;
  role: Role | null;
}

export interface ViewRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}
