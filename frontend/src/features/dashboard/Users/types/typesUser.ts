export interface User {
  userid?: number;
  createat?: string | Date;
  updateat?: string | Date;
  stateid: number;
  typeid: number;
  phone: string;
  documentnumber: string;
  image?: string | null;
  name: string;
  lastname?: string | null;
  email: string;
  password?: string;
  confirmPassword?: string;
  states?: any;
  typeofdocuments?: any;
  roleid: number;
  roles?: {
    roleid: number;
    name: string;
    status?: string;
  };
  technicians?: {
    technicianid: number;
    CV: string;
    technicianTypeMaps?: {
      techniciantypeid: number;
      techniciantype?: { name: string };
    }[];
  }[];
  customers?: {
    customerid: number;
    customercity: string | null;
    customerzipcode: string | null;
  }[];
  hasAssociations?: boolean;
}

export interface UserForTable extends User {
  id?: number;
  userid?: number;
  stateLabel?: string;
  stateSearch?: "activo" | "inactivo";
  fullNameSearch?: string;
  rowNumber: number;
}

export interface CreateUserData {
  name: string;
  lastname?: string | null;
  email: string;
  phone: string;
  typeid: number;
  documentnumber: string;
  image?: string | File | null;
  stateid: number;
  roleid: number;
  CV?: string | File | null;
  techniciantypeids?: number[];
  customercity?: string;
  customerzipcode?: string;
}

export interface EditUser {
  userid: number;
  name: string;
  lastname: string | null;
  email: string;
  phone: string;
  documentnumber: string;
  typeid: number;
  image?: string | File | null;
  stateid: number;
  roleid: number;
  CV?: string | File | null;
  techniciantypeids?: number[];
  customercity?: string;
  customerzipcode?: string;
}

export interface FormErrors {
  userid: string;
  name: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  documentnumber: string;
  typeid: string;
  stateid: string;
  image: string;
  roleid: string;
  CV: string;
  techniciantypeids: string;
  customercity: string;
  customerzipcode: string;
}

export interface FormTouched {
  userid: boolean;
  name: boolean;
  lastname: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
  phone: boolean;
  documentnumber: boolean;
  typeid: boolean;
  stateid: boolean;
  image: boolean;
  roleid: boolean;
  CV: boolean;
  techniciantypeids: boolean;
  customercity: boolean;
  customerzipcode: boolean;
}

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: CreateUserData) => void;
  users: User[];
}

export interface EditUserModalProps {
  isOpen: boolean;
  user: EditUser | null;
  onClose: () => void;
  onSave: (userData: EditUser) => void;
  users: User[];
}

export interface ViewUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

export interface UsersTableProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: EditUser) => void;
  onDelete: (user: User) => void;
  onCreate: () => void;
}
