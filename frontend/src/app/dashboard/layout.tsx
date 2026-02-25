"use client";

import { useEffect, useMemo, useState } from "react";
import AsideNav from "@/features/dashboard/layout/AsideNav";
import TopNav from "@/features/dashboard/layout/TopNav";
import RequireAuth from "@/features/auth/requireauth";
import { useAuth } from "@/features/auth/authcontext";
import { useRouter, usePathname } from "next/navigation";
import {
  MODULE_TO_PATH,
  pickDefaultDashboardRoute,
} from "@/features/auth/authz";
import { ChangePasswordModal } from "@/features/auth/Components/PasswordModals";
import { routes } from "@/shared/routes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { APP_TOAST_ID, showSuccess } from "@/shared/utils/notifications";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { user, allowedModules, ready, isAuthenticated, changePassword } =
    useAuth();

  const router = useRouter();
  const pathname = usePathname();

  const noScrollRoutes = [
    routes.dashboard.users,
    routes.dashboard.clients,
    routes.dashboard.products,
    routes.dashboard.productsCategories,
    routes.dashboard.purchases,
    routes.dashboard.purchasesGraph,
    routes.dashboard.purchasesOrders,
    routes.dashboard.quotes,
    routes.dashboard.roles,
    routes.dashboard.sales,
    routes.dashboard.services,
    routes.dashboard.suppliers,
    routes.dashboard.technicians,
  ];

  const isNoScrollRoute = noScrollRoutes.includes(pathname);

  const hideAside = allowedModules.length <= 1;

  const permissions = useMemo<string[]>(
    () => (user as any)?.permissions || [],
    [user]
  );

  useEffect(() => {
    if (!ready) return;
    if (!user) return;
    if (pathname !== "/dashboard") return;

    const target = pickDefaultDashboardRoute(permissions);
    if (target && target !== pathname) router.replace(target);
  }, [ready, user, pathname, router, permissions]);

  useEffect(() => {
    if (!ready) return;
    if (!user) return;
    if (allowedModules.length !== 1) return;

    const single = allowedModules[0] as keyof typeof MODULE_TO_PATH;
    const base = MODULE_TO_PATH[single] ?? "/dashboard";

    if (!pathname.startsWith(base)) router.replace(base);
  }, [allowedModules, ready, user, pathname, router]);

  const [forcePasswordModal, setForcePasswordModal] = useState(false);

  const mustChangePassword = !!user?.mustchangepassword;

  useEffect(() => {
    if (ready && isAuthenticated && mustChangePassword) {
      setForcePasswordModal(true);
    } else if (!mustChangePassword) {
      setForcePasswordModal(false);
    }
  }, [ready, isAuthenticated, mustChangePassword]);

  const handleForcePasswordSave = async ({
    currentPassword,
    newPassword,
  }: {
    currentPassword?: string;
    newPassword: string;
  }) => {
    const current = currentPassword || "";
    const res = await changePassword(current, newPassword);

    if (!res.ok) {
      throw new Error(res.message || "No se pudo actualizar la contrasena");
    }

    setForcePasswordModal(false);
    showSuccess("Contrasena actualizada exitosamente");
  };

  const handleForcePasswordClose = () => {
    if (mustChangePassword) {
      setForcePasswordModal(true);
      return;
    }
    setForcePasswordModal(false);
  };

  return (
    <RequireAuth>
      <ToastContainer
        containerId={APP_TOAST_ID}
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        newestOnTop
        limit={3}
        style={{ zIndex: 999999 }}
      />

      <div className="flex h-screen">
        {!hideAside && (
          <AsideNav isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        )}

        <div
          className="flex flex-col transition-all duration-300"
          style={{
            width: hideAside
              ? "100%"
              : isCollapsed
              ? "100%"
              : "calc(100% - 16rem)",
            marginLeft: hideAside ? 0 : isCollapsed ? 0 : "16rem",
          }}
        >
          <TopNav />

          <main
            className={`flex-1 h-50 bg-gray-100 p-6 overflow-x-hidden scrollbar-thin ${
              isNoScrollRoute ? "overflow-y-hidden" : ""
            }`}
          >
            {children}
          </main>
        </div>
      </div>

      <ChangePasswordModal
        open={forcePasswordModal}
        onClose={handleForcePasswordClose}
        onSave={handleForcePasswordSave}
        requireCurrent
        disableDismiss={mustChangePassword}
      />
    </RequireAuth>
  );
}
