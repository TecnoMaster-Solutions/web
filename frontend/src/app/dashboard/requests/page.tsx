"use client";

import { useMemo } from "react";
import { useAuth } from "@/features/auth/authcontext";
import RequestsPage from "@/features/dashboard/requests/pages/ServiceRequestsPage";
import ServiceRequestsClientsPage from "@/features/dashboard/requests/pages/ServiceRequestsClientsPage";

function normalizeRoleName(role: any) {
  return String(role ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export default function RequestsRootPage() {
  const { user, profile } = useAuth();

  const isClientRole = useMemo(() => {
    const role = [
      user?.rolename,
      (user as any)?.role,
      (user as any)?.role?.name,
      profile?.rolename,
      (profile as any)?.role,
      (profile as any)?.role?.name,
    ]
      .map((r) => normalizeRoleName(r))
      .find(Boolean);

    return role === "cliente" || role === "client" || role === "customer";
  }, [user, profile]);

  if (isClientRole) return <ServiceRequestsClientsPage />;

  return <RequestsPage />;
}
