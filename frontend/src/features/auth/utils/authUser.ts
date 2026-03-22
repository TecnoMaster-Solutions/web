export type RoleLike =
  | string
  | {
      name?: string | null;
    }
  | null
  | undefined;

export interface AuthIdentityLike {
  userid?: number | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  documentnumber?: string | null;
  rolename?: string | null;
  role?: RoleLike;
  permissions?: string[] | null;
  customer?: {
    customerid?: number | null;
  } | null;
  users?: {
    userid?: number | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    documentnumber?: string | null;
  } | null;
}

export type AuthProfile = AuthIdentityLike;

type ErrorWithMessage = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

export function getAuthUserId(user?: AuthIdentityLike | null): number | null {
  const value = user?.userid;
  return typeof value === "number" ? value : null;
}

export function getAuthPermissions(user?: AuthIdentityLike | null): string[] {
  return Array.isArray(user?.permissions)
    ? user.permissions.filter((permission): permission is string => typeof permission === "string")
    : [];
}

export function getRawRoleName(source?: AuthIdentityLike | null): string | null {
  if (typeof source?.rolename === "string" && source.rolename.trim()) {
    return source.rolename;
  }

  if (typeof source?.role === "string" && source.role.trim()) {
    return source.role;
  }

  if (
    source?.role &&
    typeof source.role === "object" &&
    typeof source.role.name === "string" &&
    source.role.name.trim()
  ) {
    return source.role.name;
  }

  return null;
}

export function normalizeRoleName(role?: string | null): string {
  return String(role ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const candidate = (error as ErrorWithMessage | null)?.response?.data?.message;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate;
  }

  if (Array.isArray(candidate)) {
    const firstMessage = candidate.find(
      (message): message is string => typeof message === "string" && message.trim().length > 0
    );
    if (firstMessage) return firstMessage;
  }

  return fallback;
}
