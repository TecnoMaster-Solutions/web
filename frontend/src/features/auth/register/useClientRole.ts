import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useClientRole() {
  const [clientRoleId, setClientRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRole() {
      try {
        const { data } = await api.get("/roles");
        const role = data.find((r: any) => r.name?.toLowerCase() === "cliente");
        setClientRoleId(role?.roleid || null);
      } catch {
        setClientRoleId(null);
      } finally {
        setLoading(false);
      }
    }
    loadRole();
  }, []);

  return { clientRoleId, loading };
}
