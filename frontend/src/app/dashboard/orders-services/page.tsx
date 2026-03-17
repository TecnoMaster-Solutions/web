"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ServiceOrdersPage from "@/features/dashboard//OrdersServices/Pages/OrderServicesPage";
import { useAuth } from "@/features/auth/authcontext";
import {
  getRawRoleName,
  normalizeRoleName,
} from "@/features/auth/utils/authUser";
import { routes } from "@/shared/routes";

export default function OrdersServicesPage() {
  const router = useRouter();
  const { user, profile, ready } = useAuth();

  const isClientRole = useMemo(() => {
    const role = [getRawRoleName(user), getRawRoleName(profile)]
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
