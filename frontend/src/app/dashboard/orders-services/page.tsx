"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ServiceOrdersPage from "@/features/dashboard//OrdersServices/Pages/OrderServicesPage";
import { useAuth } from "@/features/auth/authcontext";
import { routes } from "@/shared/routes";

function normalizeRoleName(role: any) {
  return String(role ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export default function OrdersServicesPage() {
  const router = useRouter();
  const { user, profile, ready } = useAuth();

  const isClientRole = useMemo(() => {
    const role = [
      user?.rolename,
      (user as any)?.role,
      (user as any)?.role?.name,
      profile?.rolename,
      (profile as any)?.role,
      (profile as any)?.role?.name,
    ]
      .map((item) => normalizeRoleName(item))
      .find(Boolean);

    return role === "cliente" || role === "client" || role === "customer";
  }, [user, profile]);

  useEffect(() => {
    if (!ready) return;
    if (!isClientRole) return;
    router.replace(routes.dashboard.orders);
  }, [isClientRole, ready, router]);

  if (ready && isClientRole) return null;

  return <ServiceOrdersPage />;
}
