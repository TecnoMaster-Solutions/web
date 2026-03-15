"use client";

import { useMemo } from "react";
import { useAuth } from "@/features/auth/authcontext";
import RequestsPage from "@/features/dashboard/requests/pages/ServiceRequestsPage";
import ServiceRequestsClientsPage from "@/features/dashboard/requests/pages/ServiceRequestsClientsPage";
import {
  getRawRoleName,
  normalizeRoleName,
} from "@/features/auth/utils/authUser";

export default function RequestsRootPage() {
  const { user, profile } = useAuth();

  const isClientRole = useMemo(() => {
    const role = [getRawRoleName(user), getRawRoleName(profile)]
      .map((r) => normalizeRoleName(r))
      .find(Boolean);

    return role === "cliente" || role === "client" || role === "customer";
  }, [user, profile]);

  if (isClientRole) return <ServiceRequestsClientsPage />;

  return <RequestsPage />;
}
