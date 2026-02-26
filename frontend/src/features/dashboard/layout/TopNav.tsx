"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { UserCircle, LogOut, Pencil, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { routes } from "@/shared/routes";
import { useAuth } from "@/features/auth/authcontext";
import ProfileModal from "@/features/auth/porfile/porfilemodal";

const titles: Record<string, string> = {
  [routes.dashboard.main]: "Dashboard",
  [routes.dashboard.users]: "Usuarios",
  [routes.dashboard.roles]: "Roles",
  [routes.dashboard.purchases]: "Compras",
  [routes.dashboard.purchasesOrders]: "Ordenes de Compras",
  [routes.dashboard.services]: "Servicios",
  [routes.dashboard.technicians]: "Tecnicos",
  [routes.dashboard.newService]: "Nuevo Servicio",
  [routes.dashboard.clients]: "Clientes",
  [routes.dashboard.newClient]: "Nuevo Cliente",
  [routes.dashboard.settings]: "Configuración",
  [routes.dashboard.products]: "Productos",
  [routes.dashboard.productsCategories]: "Categoría de Productos",
  [routes.dashboard.suppliers]: "Proveedores",
  [routes.dashboard.requestsServices]: "Solicitudes de Servicio",
  [routes.dashboard.ordersServices]: "Ordenes de Servicio",
  [routes.dashboard.orders]: "Órdenes de Servicio",
  [routes.dashboard.appointments]: "Citas",
  [routes.dashboard.sales]: "Ventas",
  [routes.dashboard.quotes]: "Cotizaciones",
};

type TopNavProps = {
  logoutRedirectTo?: string;
  fallbackUserName?: string;
};

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function TopNav({
  logoutRedirectTo = "/auth/login",
  fallbackUserName = "Usuario",
}: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuProfileOpen, setMenuProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentTitle =
    titles[pathname] ||
    Object.entries(titles)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => pathname.startsWith(path))?.[1] ||
    "Órdenes de Servicio";

  const display = useMemo(() => {
    const name =
      profile?.name ??
      user?.name ??
      profile?.users?.name ??
      fallbackUserName;

    const email = profile?.email ?? user?.email ?? profile?.users?.email ?? "";
    const image = profile?.image ?? user?.image ?? profile?.users?.image ?? "";

    return { name, email, image };
  }, [profile, user, fallbackUserName]);

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const id = setInterval(() => {
      if (i < currentTitle.length) {
        setDisplayedText(currentTitle.slice(0, i + 1));
        i++;
      } else {
        clearInterval(id);
      }
    }, 80);
    return () => clearInterval(id);
  }, [currentTitle]);

  useEffect(() => {
    router.prefetch(logoutRedirectTo);
  }, [router, logoutRedirectTo]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuProfileOpen) return;
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setMenuProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuProfileOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuProfileOpen]);

  const handleLogout = async () => {
    setMenuProfileOpen(false);
    setLoading(true);

    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("__toast_login_success__");
      }
      await logout();
      router.replace(logoutRedirectTo);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = () => {
    setMenuProfileOpen(false);
    setProfileOpen(true);
  };

  return (
    <>
      {loading && <Loader />}

      <header className="bg-white shadow-[0_6px_10px_-1px_rgba(0,0,0,0.25)] px-4 md:px-8 py-3 flex items-center justify-between relative">
        <h1 className="text-xl md:text-4xl font-bold text-red-800 pl-2 md:pl-5">
          {displayedText}
        </h1>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden text-gray-700 mr-2"
          aria-label="Abrir menú"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="relative">
          <button
            ref={btnRef}
            onClick={() => setMenuProfileOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuProfileOpen}
            className={[
              "flex items-center gap-3 rounded-full px-3 py-1 outline-none transition",
              "focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
              menuProfileOpen
                ? "bg-red-700 border border-red-700 shadow-sm"
                : "bg-gray-100 border border-gray-200 hover:bg-gray-200 shadow-sm",
            ].join(" ")}
          >
            <span
              className={[
                "hidden md:block max-w-[180px] truncate transition-colors",
                menuProfileOpen ? "text-white" : "text-gray-800",
              ].join(" ")}
            >
              {display.name}
            </span>

            {display.image ? (
              <img
                src={display.image}
                alt="avatar"
                className={[
                  "w-9 h-9 md:w-10 md:h-10 rounded-full object-cover transition",
                  menuProfileOpen
                    ? "ring-2 ring-white/70"
                    : "ring-2 ring-gray-300",
                ].join(" ")}
              />
            ) : (
              <UserCircle
                className={[
                  "w-9 h-9 md:w-10 md:h-10 transition-colors",
                  menuProfileOpen ? "text-white" : "text-gray-700",
                ].join(" ")}
              />
            )}
          </button>

          {menuProfileOpen && (
            <div
              ref={menuRef}
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-xl z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium truncate">{display.name}</p>
                {!!display.email && (
                  <p className="text-xs text-gray-500 truncate">
                    {display.email}
                  </p>
                )}
              </div>

              <button
                onClick={handleOpenProfile}
                role="menuitem"
                className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-50"
              >
                <Pencil size={16} />
                Editar perfil
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                role="menuitem"
                className="w-full text-left px-4 py-3 flex items-center gap-2 text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                <LogOut size={16} />
                {loading ? "Saliendo…" : "Cerrar sesión"}
              </button>
            </div>
          )}
        </div>

        <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      </header>
    </>
  );
}
