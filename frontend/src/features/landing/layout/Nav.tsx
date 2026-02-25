"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ShoppingCart, Menu, X, UserCircle, Pencil, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { routes } from "@/shared/routes";
import CartModal from "../components/CartModal";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "@/features/auth/authcontext";
import ProfileModal from "@/features/auth/porfile/porfilemodal";

const Nav = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { cart } = useCart();
  const { isAuthenticated, user, profile, logout } = useAuth();

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const display = useMemo(() => {
    const name =
      profile?.name ??
      user?.name ??
      profile?.users?.name ??
      "Usuario";

    const email =
      profile?.email ?? user?.email ?? profile?.users?.email ?? "";

    const image = profile?.image ?? user?.image ?? profile?.users?.image ?? "";

    return { name, email, image };
  }, [profile, user]);

  const links = [
    { href: routes.landing.services, label: "Servicios" },
    { href: routes.landing.products, label: "Productos" },
    { href: routes.landing.about, label: "Nosotros" },
    { href: routes.landing.contact, label: "Contactanos" },
  ];

  const guestLinks = [
    { href: routes.auth.login, label: "Acceder" },
    { href: routes.auth.register, label: "Registrarse" },
  ];

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!profileMenuOpen) return;
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setProfileMenuOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    setIsMenuOpen(false);
    setLoggingOut(true);
    try {
      await logout();
      router.replace(routes.auth.login);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleOpenProfile = () => {
    setProfileMenuOpen(false);
    setIsMenuOpen(false);
    setProfileOpen(true);
  };

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link
            href={routes.path}
            className="relative flex items-center overflow-hidden group rounded-md"
          >
            <Image
              src="/assets/imgs/logo.png"
              alt="logo"
              width={180}
              height={50}
              priority
              className="relative z-10 cursor-pointer transition duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-gray-900 font-semibold text-lg">
            {[...links, ...(isAuthenticated ? [] : guestLinks)].map((link) => (
              <Link key={link.href} href={link.href} className="relative group">
                <span className="relative z-10">{link.label}</span>
                {/* underline animado */}
                <span className="absolute left-0 -bottom-1 h-[3px] w-full origin-left scale-x-0 bg-red-700 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}

            {isAuthenticated && (
              <div className="relative">
                <button
                  ref={btnRef}
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  className={[
                    "flex items-center gap-3 rounded-full px-3 py-1 border transition shadow-sm",
                    profileMenuOpen
                      ? "bg-red-700 border-red-700 text-white"
                      : "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800",
                  ].join(" ")}
                >
                  <span className="max-w-[160px] truncate">{display.name}</span>
                  {display.image ? (
                    <img
                      src={display.image}
                      alt="avatar"
                      className={[
                        "w-9 h-9 rounded-full object-cover transition",
                        profileMenuOpen
                          ? "ring-2 ring-white/70"
                          : "ring-2 ring-gray-300",
                      ].join(" ")}
                    />
                  ) : (
                    <UserCircle
                      className={[
                        "w-9 h-9 transition-colors",
                        profileMenuOpen ? "text-white" : "text-gray-700",
                      ].join(" ")}
                    />
                  )}
                </button>

                {profileMenuOpen && (
                  <div
                    ref={menuRef}
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium truncate">
                        {display.name}
                      </p>
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

                    <Link
                      href={routes.dashboard.main}
                      onClick={() => setProfileMenuOpen(false)}
                      role="menuitem"
                      className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-50"
                    >
                      <UserCircle size={16} />
                      Ir al dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      role="menuitem"
                      className="w-full text-left px-4 py-3 flex items-center gap-2 text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      <LogOut size={16} />
                      {loggingOut ? "Saliendo..." : "Cerrar sesion"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Carrito Desktop */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative cursor-pointer ml-4 text-black px-4 py-1 rounded-md flex items-center justify-center group transition-colors duration-300"
              aria-label="Abrir carrito"
            >
              <span className="absolute rounded-md inset-0 bg-red-800 scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              <ShoppingCart className="h-7 w-7 relative z-10 transition-colors duration-300 group-hover:text-white" />

              {/* Bolita con la cantidad */}
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#B20000] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menu movil"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="h-8 w-8" />
            ) : (
              <Menu className="h-8 w-8" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden bg-white px-6 py-5 flex flex-col gap-5 shadow-md transform transition-all duration-300 ${
            isMenuOpen
              ? "max-h-[600px] opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          {[...links, ...(isAuthenticated ? [] : guestLinks)].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-medium text-gray-800 hover:text-red-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {isAuthenticated && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-3">
                {display.image ? (
                  <img
                    src={display.image}
                    alt="avatar"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                  />
                ) : (
                  <UserCircle className="w-12 h-12 text-gray-700" />
                )}
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">
                    {display.name}
                  </span>
                  {!!display.email && (
                    <span className="text-sm text-gray-600 truncate">
                      {display.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={handleOpenProfile}
                  className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Pencil size={16} />
                  Editar perfil
                </button>

                <Link
                  href={routes.dashboard.profile}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
                >
                  <UserCircle size={16} />
                  Ver perfil
                </Link>

                <Link
                  href={routes.dashboard.main}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
                >
                  <UserCircle size={16} />
                  Ir al dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-2 disabled:opacity-60"
                >
                  <LogOut size={16} />
                  {loggingOut ? "Saliendo..." : "Cerrar sesion"}
                </button>
              </div>
            </div>
          )}

          {/* Carrito en movil */}
          <button
            onClick={() => {
              setIsCartOpen(true);
              setIsMenuOpen(false);
            }}
            className="relative cursor-pointer bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md flex items-center justify-center transition"
          >
            <ShoppingCart className="h-5 w-5 mr-2" /> Carrito
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-[#B20000] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Modal del carrito */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
};

export default Nav;
