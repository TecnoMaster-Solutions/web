import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/authcontext";
import { getRoleFromTokenCookie, normalizeRoleName } from "../helpers/authToken.helpers";

export const useRoleScope = () => {
  const { profile, user } = useAuth();
  const [tokenRole, setTokenRole] = useState<string | null>(null);
  const [tokenRoleNormalized, setTokenRoleNormalized] = useState<string | null>(null);

  useEffect(() => {
    const role = getRoleFromTokenCookie();
    setTokenRole(role);
    setTokenRoleNormalized(normalizeRoleName(role));
  }, []);

  const clientProfileId = useMemo(() => {
    if (tokenRoleNormalized !== "cliente") return null;
    const userId = user?.userid;
    return Number.isFinite(userId ?? NaN) && userId && userId > 0 ? userId : null;
  }, [tokenRoleNormalized, user]);

  const technicianProfileUserId = useMemo(() => {
    if (tokenRoleNormalized !== "tecnico") return null;
    const candidate = profile?.userid ?? profile?.users?.userid ?? user?.userid;
    return Number.isFinite(candidate ?? NaN) && candidate && candidate > 0 ? candidate : null;
  }, [tokenRoleNormalized, profile, user]);

  return { tokenRole, tokenRoleNormalized, clientProfileId, technicianProfileUserId };
};
