export interface AuthUser {
  userid: number;
  name: string;
  lastname: string;
  phone: string;
  email: string;
  avatar?: string | null;
  image?: string | null;
  roleid?: number;
  rolename?: string;
  stateid?: number;
  isactive?: boolean;
  permissions?: string[];
  mustchangepassword?: boolean;
}
