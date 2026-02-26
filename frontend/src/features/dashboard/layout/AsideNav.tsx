"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Wrench,
  Truck,
  ChevronDown,
  Box,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import Colors from "@/shared/theme/colors";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { routes } from "@/shared/routes";
import { useAuth } from "@/features/auth/authcontext";
import { canViewModule, type AuthzModule } from "@/features/auth/authz";

const MenuItem = React.memo(
  ({
    href,
    icon: Icon,
    label,
    isActive,
    onClick,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick?: () => void;
  }) => (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-md text-base transition transform duration-200 ${
        isActive
          ? "bg-red-800 text-white hover:scale-105"
          : "hover:bg-red-600 hover:scale-105"
      }`}
    >
      <Icon size={20} /> {label}
    </Link>
  )
);

MenuItem.displayName = "MenuItem";

const SubMenu = React.memo(
  ({
    parent,
    icon: Icon,
    label,
    childrenRoutes,
    pathname,
    openMenu,
    toggleMenu,
    items,
    setOpenMenu,
  }: {
    parent: string;
    icon: React.ElementType;
    label: string;
    childrenRoutes: string[];
    pathname: string;
    openMenu: string | null;
    toggleMenu: (menu: string) => void;
    items: { href: string; label: string }[];
    setOpenMenu: (menu: string | null) => void;
  }) => {
    const isActive = childrenRoutes.some((child) => pathname.startsWith(child));

    return (
      <div
        className="relative"
        onMouseEnter={() => setOpenMenu(parent)}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <button
          onClick={() => toggleMenu(parent)}
          className={`cursor-pointer flex items-center justify-between w-full px-4 py-3 rounded-md text-base transition transform duration-200 ${
            isActive
              ? "bg-red-800 text-white hover:scale-105"
              : "hover:bg-red-600 hover:scale-105"
          }`}
        >
          <span className="flex items-center gap-2">
            <Icon size={20} /> {label}
          </span>
          <ChevronDown
            size={18}
            className={`transition-transform ${
              openMenu === parent ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {openMenu === parent && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute top-0 left-full ml-1 bg-white text-red-800 rounded-md shadow-lg flex flex-col w-60 z-50"
            >
              {items.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpenMenu(null)}
                  className="px-4 py-3 hover:bg-red-100 hover:text-red-700 transition rounded-md"
                >
                  {label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

SubMenu.displayName = "SubMenu";

const AsideNav = ({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const { user } = useAuth();

  const permissions = useMemo<string[]>(
    () =>
      ((user as any)?.permissions ||
        (user as any)?.permission ||
        []) as string[],
    [user]
  );

  const canView = useCallback(
    (module: AuthzModule) => canViewModule(permissions, module),
    [permissions]
  );

  const toggleMenu = useCallback(
    (menu: string) => {
      setOpenMenu(openMenu === menu ? null : menu);
    },
    [openMenu]
  );

  const isLinkActive = useCallback(
    (href: string) => {
      if (href === routes.dashboard.main) return pathname === href;
      return (
        pathname === href ||
        pathname.startsWith(href + "/") ||
        pathname.startsWith(href)
      );
    },
    [pathname]
  );

  const menuConfig = useMemo(
    () => [
      {
        type: "link" as const,
        href: routes.dashboard.main,
        label: "Dashboard",
        icon: Home,
        module: "dashboard" as AuthzModule,
      },
      {
        type: "link" as const,
        href: routes.dashboard.users,
        label: "Usuarios",
        icon: Users,
        module: "users" as AuthzModule,
      },
      {
        type: "link" as const,
        href: routes.dashboard.roles,
        label: "Roles",
        icon: Users,
        module: "Roles" as AuthzModule,
      },
      {
        type: "submenu" as const,
        parent: "compras",
        icon: Truck,
        label: "Compras",
        childrenRoutes: [
          routes.dashboard.suppliers,
          routes.dashboard.purchasesOrders,
          routes.dashboard.purchases,
        ],
        items: [
          {
            href: routes.dashboard.suppliers,
            label: "Proveedores",
            module: "suppliers" as AuthzModule,
          },
          {
            href: routes.dashboard.purchasesOrders,
            label: "Órdenes de compras",
            module: "purchaseOrders" as AuthzModule,
          },
          {
            href: routes.dashboard.purchases,
            label: "Compras",
            module: "purchases" as AuthzModule,
          },
],
      },
      {
        type: "submenu" as const,
        parent: "productos",
        icon: Box,
        label: "Productos",
        childrenRoutes: [
          routes.dashboard.products,
          routes.dashboard.productsCategories,
        ],
        items: [
          {
            href: routes.dashboard.productsCategories,
            label: "Categorías",
            module: "categoryProducts" as AuthzModule,
          },
          {
            href: routes.dashboard.products,
            label: "Productos",
            module: "products" as AuthzModule,
          },
        ],
      },
      {
        type: "submenu" as const,
        parent: "servicios",
        icon: Wrench,
        label: "Servicios",
        childrenRoutes: [
          routes.dashboard.services,
          routes.dashboard.technicians,
        ],
        items: [
          {
            href: routes.dashboard.services,
            label: "Servicios",
            module: "services" as AuthzModule,
          },
          {
            href: routes.dashboard.technicians,
            label: "Técnicos",
            module: "technicians" as AuthzModule,
          },
        ],
      },
      {
        type: "submenu" as const,
        parent: "ventas",
        icon: Users,
        label: "Ventas",
        childrenRoutes: [
          routes.dashboard.sales,
          routes.dashboard.clients,
          routes.dashboard.requestsServices,
          routes.dashboard.ordersServices,
          routes.dashboard.appointments,
          routes.dashboard.quotes,
        ],
        items: [
          {
            href: routes.dashboard.sales,
            label: "Ventas",
            module: "sales" as AuthzModule,
          },
          {
            href: routes.dashboard.clients,
            label: "Clientes",
            module: "customers" as AuthzModule,
          },
          {
            href: routes.dashboard.requestsServices,
            label: "Solicitudes",
            module: "servicesRequest" as AuthzModule,
          },
          {
            href: routes.dashboard.ordersServices,
            label: "Órdenes",
            module: "orderServices" as AuthzModule,
          },
          {
            href: routes.dashboard.appointments,
            label: "Citas",
            module: "appointments" as AuthzModule,
          },
          {
            href: routes.dashboard.quotes,
            label: "Cotizaciones",
            module: "quotes" as AuthzModule,
          },
        ],
      },
      {
        type: "link" as const,
        href: routes.path,
        label: "volver",
        icon: ChevronLeft,
      },
    ],
    [isLinkActive, pathname]
  );

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: isCollapsed ? -260 : 0 }}
      transition={{ duration: 0.3 }}
      className="text-white w-64 h-screen flex flex-col fixed left-0 top-0 z-50 shadow-[6px_0_12px_-2px_rgba(0,0,0,0.25)]"
      style={{ backgroundColor: Colors.asideNavBackground.primary }}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="cursor-pointer absolute -right-5 top-4 bg-red-700 text-white rounded-full p-1 drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)] hover:bg-red-600 transition"
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <div className="flex items-center gap-2 px-4 py-3 mb-4">
        <div className="w-8 h-8 flex items-center justify-center bg-red-600 rounded-lg text-white font-bold">
          V
        </div>
        <div>
          <h1 className="text-5xl font-bold text-white">Vertecx</h1>
          <p className="text-xs text-center text-white">Panel de gestión</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {menuConfig.map((item) => {
          if (item.type === "link") {
            if (item.module && !canView(item.module)) return null;

            return (
              <MenuItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isLinkActive(item.href)}
              />
            );
          }

          if (item.type === "submenu") {
            const visibleItems = item.items.filter((i) => canView(i.module));
            if (visibleItems.length === 0) return null;

            if (visibleItems.length === 1) {
              const only = visibleItems[0];
              return (
                <MenuItem
                  key={only.href}
                  href={only.href}
                  icon={item.icon}
                  label={only.label}
                  isActive={isLinkActive(only.href)}
                />
              );
            }

            return (
              <SubMenu
                key={item.parent}
                parent={item.parent}
                icon={item.icon}
                label={item.label}
                childrenRoutes={item.childrenRoutes}
                pathname={pathname}
                openMenu={openMenu}
                toggleMenu={toggleMenu}
                items={visibleItems}
                setOpenMenu={setOpenMenu}
              />
            );
          }

          return null;
        })}
      </nav>
    </motion.aside>
  );
};

export default AsideNav;
