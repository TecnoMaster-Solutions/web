"use client";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import ClientCreateRequestModal from "@/features/dashboard/requests/components/ClientRequestModal";
import { useCreateServiceRequest } from "@/features/dashboard/requests/hooks/useServiceRequests";
import { showSuccess, showError } from "@/shared/utils/notifications";
import { useAuth } from "@/features/auth/authcontext";
import {
  createSaleCheckoutAndRedirect,
  openMercadoPagoCheckoutPlaceholderWindow,
} from "@/features/payments/mercado-pago/services/mercadoPagoCheckout.service";

function getUserFromToken(): SessionUser | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;

    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (!payload.userid || payload.exp < now) return null;

    return {
      userid: payload.userid,
      email: payload.email,
      name: payload.name,
      roleid: payload.roleid,
      rolename: payload.rolename,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

type SessionUser = {
  userid: number;
  email: string;
  name: string;
  roleid: number;
  rolename: string;
  exp: number;
};

interface CartModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  mode?: "modal" | "page";
}

type Address = {
  city: string;
  zone: string;
  streetType: string;
  streetNumber: string;
  secondaryNumber: string;
  complement?: string;
};

const CITIES = ["Medellín", "Bogotá", "Cali", "Barranquilla"];
const ZONES = ["Centro", "Norte", "Sur", "Oriente", "Occidente"];
const STREET_TYPES = ["Calle", "Carrera", "Avenida", "Transversal", "Diagonal"];

function buildSalePayload({
  cart,
  customerId,
}: {
  cart: typeof cart;
  customerId: number;
}) {
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const taxpercent = 19;
  const taxamount = Math.round((subtotal * taxpercent) / 100);

  return {
    customerid: customerId,
    saledate: new Date().toISOString(),
    salecode: `VEN-${Date.now()}`,
    subtotal,
    taxpercent,
    taxamount,
    discountamount: 0,
    totalamount: subtotal + taxamount + 20000,
    paymentmethod: "Cash",
    salestatus: "Pending",
    notes: "Venta creada desde carrito",
    details: cart.map((item) => ({
      productid: Number(item.id),
      quantity: item.quantity,
      unitprice: item.price,
      discountpercent: 0,
    })),
  };
}

export default function CartModal({
  isOpen = false,
  onClose,
  mode = "modal",
}: CartModalProps) {
  const extractCustomerId = (userData: any, profileData: any): number => {
    const candidates = [
      userData?.customerid,
      userData?.clientId,
      userData?.clientid,
      userData?.customer?.customerid,
      userData?.customers?.[0]?.customerid,
      profileData?.customerid,
      profileData?.clientId,
      profileData?.clientid,
      profileData?.customer?.customerid,
      profileData?.customers?.[0]?.customerid,
      profileData?.customer?.id,
      profileData?.customers?.[0]?.id,
    ];

    for (const c of candidates) {
      const n = Number(c);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
  };

  const [openProducts, setOpenProducts] = useState<Set<number>>(new Set());
  const [addressError, setAddressError] = useState("");
  const [error, setError] = useState("");
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  const createRequestMut = useCreateServiceRequest();
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [serviceDraft, setServiceDraft] = useState<CreateRequestPayload | null>(
    null
  );

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );
  const [pendingServiceCartItemId, setPendingServiceCartItemId] = useState<
    string | null
  >(null);

  const [address, setAddress] = useState({
    city: "",
    zone: "",
    streetType: "",
    streetNumber: "",
    secondaryNumber: "",
    complement: "",
  });

  const { cart, updateQuantity, toggleService, removeFromCart } = useCart();
  const { user, profile } = useAuth();

  useEffect(() => {
    const user = getUserFromToken();
    setAuthUser(user);

    // Inicializar con todos los productos desplegados
    const allProductIds = new Set(cart.map((item) => item.id));
    setOpenProducts(allProductIds);
  }, []);

  // Actualizar openProducts cuando cambie el carrito
  useEffect(() => {
    const currentIds = Array.from(openProducts);
    const newIds = cart.map((item) => item.id);

    // Mantener los que ya estaban abiertos y agregar nuevos productos
    const updatedSet = new Set([
      ...currentIds.filter((id) => newIds.includes(id)),
      ...newIds.filter((id) => !currentIds.includes(id)),
    ]);

    setOpenProducts(updatedSet);
  }, [cart]);

  const isPage = mode === "page";

  if (!isPage && !isOpen) return null;

  const hasService = cart.some((item) => item.service);
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const customerName =
    profile?.name ??
    user?.name ??
    profile?.users?.name ??
    authUser?.name ??
    "Cliente";
  const customerDocument =
    profile?.documentnumber ??
    (user as any)?.documentnumber ??
    profile?.users?.documentnumber ??
    profile?.customer?.documentnumber ??
    "-";
  const customerIdForSale = extractCustomerId(user, profile);
  const authUserId = Number(
    authUser?.userid ??
      (user as any)?.userid ??
      (profile as any)?.userid ??
      (profile as any)?.users?.userid ??
      0
  );
  const authUserNameLabel =
    authUser?.name ??
    user?.name ??
    profile?.name ??
    profile?.users?.name ??
    customerName;

  const validateAddress = (): string | null => {
    if (!address.city) return "Seleccione una ciudad";
    if (!address.zone) return "Seleccione la zona o barrio";
    if (!address.streetType) return "Seleccione el tipo de vía";
    if (!address.streetNumber.trim()) return "Ingrese el número de la vía";
    if (!address.secondaryNumber.trim()) return "Ingrese el número secundario";
    return null;
  };

  const fullAddress = `${address.streetType} ${address.streetNumber} #${address.secondaryNumber
    }, ${address.zone}, ${address.city}${address.complement ? ` (${address.complement})` : ""
    }`;

  const handlePurchase = async () => {
    if (!cart.length || isRedirectingToCheckout) {
      return;
    }

    if (hasService) {
      const validationError = validateAddress();
      if (validationError) {
        setAddressError(validationError);
        return;
      }
    } else {
      setAddressError("");
    }

    if (!authUserId) {
      showError("Usuario no autenticado.");
      return;
    }

    if (!customerIdForSale) {
      showError("No se encontró el cliente asociado al usuario.");
      return;
    }

    let checkoutPopup: Window | null = null;

    try {
      setIsRedirectingToCheckout(true);
      checkoutPopup = openMercadoPagoCheckoutPlaceholderWindow();

      // Crear solicitud de servicio (si existe)
      if (hasService && serviceDraft) {
        await createRequestMut.mutateAsync(serviceDraft);
      }

      // Persistencia auxiliar (opcional)
      localStorage.setItem(
        "vertecx_cart",
        JSON.stringify({
          cart,
          address,
          total,
          hasService,
          savedAt: new Date().toISOString(),
        })
      );

      const payerEmail =
        authUser?.email ??
        (user as any)?.email ??
        (profile as any)?.email ??
        (profile as any)?.users?.email;

      const checkoutPayload = {
        items: cart.map((item) => ({
          id: String(item.id),
          title: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        customerId: customerIdForSale,
        payer: {
          name: customerName,
          email: payerEmail,
        },
        metadata: {
          customerId: customerIdForSale,
          authUserId,
          hasService,
          cartItems: cart.length,
          subtotal: Math.round(total),
          shipping: 20000,
          tax: Math.round(total * 0.19),
          totalAmount: Math.round(total + 20000 + total * 0.19),
          country: "CO",
          currency: "COP",
        },
      };

      await createSaleCheckoutAndRedirect(checkoutPayload, {
        popupWindow: checkoutPopup,
      });
    } catch (err) {
      if (checkoutPopup && !checkoutPopup.closed) {
        checkoutPopup.close();
      }
      console.error("Error al completar compra desde carrito:", err);
      showError("No se pudo iniciar el pago con Mercado Pago.");
      setIsRedirectingToCheckout(false);
    }
  };

  return (
    <div
      className={
        isPage
          ? "min-h-screen bg-gray-100 px-4 py-8"
          : "fixed inset-0 z-50 flex items-center justify-center"
      }
    >
      {/* Fondo oscuro */}
      {!isPage && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      {/* Contenido */}
      <motion.div
        initial={isPage ? { opacity: 0, y: 16 } : { opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={isPage ? { opacity: 0, y: 16 } : { opacity: 0, y: -50 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`relative bg-white rounded-2xl shadow-xl w-full max-w-6xl p-6 ${
          isPage
            ? "mx-auto overflow-visible"
            : "z-50 max-h-[95vh] overflow-y-auto scroll-smooth"
        }`}
      >
        {/* Botón cerrar */}
        {!isPage && (
          <button
            className="cursor-pointer absolute top-4 right-4 text-gray-700 hover:text-black"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        )}

        <h2 className="text-3xl font-semibold mb-6">Tu carrito</h2>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          <div className="space-y-6 min-w-0">
        {/* Datos cliente / dirección (izquierda) */}
        <div className="hidden w-full bg-gray-50 p-4 rounded-xl shadow-inner border border-gray-200 [&>p]:hidden">
          <div className="space-y-2">
            <p className="text-gray-800">
              <span className="font-semibold">Nombre:</span> {customerName}
            </p>
            <p className="text-gray-800">
              <span className="font-semibold">Cédula:</span> {customerDocument}
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            <h4 className="font-semibold text-gray-800">Dirección de envío</h4>

            <select
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="border rounded p-2 bg-white"
            >
              <option value="">Ciudad</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={address.zone}
              onChange={(e) => setAddress({ ...address, zone: e.target.value })}
              className="border rounded p-2 bg-white"
            >
              <option value="">Zona / Barrio</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={address.streetType}
                onChange={(e) =>
                  setAddress({ ...address, streetType: e.target.value })
                }
                className="border rounded p-2 bg-white"
              >
                <option value="">Tipo</option>
                {STREET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <input
                placeholder="Número"
                value={address.streetNumber}
                onChange={(e) =>
                  setAddress({ ...address, streetNumber: e.target.value })
                }
                className="border rounded p-2 bg-white"
              />
            </div>

            <input
              placeholder="# secundaria (ej: 23-18)"
              value={address.secondaryNumber}
              onChange={(e) =>
                setAddress({ ...address, secondaryNumber: e.target.value })
              }
              className="border rounded p-2 bg-white"
            />

            <input
              placeholder="Complemento (Apto, Casa, Torre...)"
              value={address.complement}
              onChange={(e) => setAddress({ ...address, complement: e.target.value })}
              className="border rounded p-2 bg-white"
            />

            {addressError && (
              <p className="text-sm text-red-600 font-medium">{addressError}</p>
            )}
          </div>

          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <p className="font-semibold text-gray-900">
              Productos del carrito ({cart.length})
            </p>
            <p className="text-sm text-gray-600">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} unidades
            </p>
          </div>

        {/* productos */}
        <div
          className={`flex flex-col gap-4 pr-2 ${
            isPage ? "max-h-none overflow-visible" : "max-h-[42vh] overflow-y-auto"
          }`}
        >
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{}}
                whileTap={{ scale: 0.97 }}
                layout
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={`cursor-pointer bg-gray-50 rounded-xl shadow-md hover:shadow-xl p-4 relative w-full
  ${isPage || openProducts.has(item.id)
                    ? "flex flex-col gap-4"
                    : "flex flex-col sm:flex-row sm:items-center gap-4"
                  }`}
              >
                {/* Flecha de despliegue - arriba a la izquierda */}
                {!isPage && (
                  <div className="absolute top-2 left-2 z-10">
                    <button
                      className="cursor-pointer p-1 hover:bg-gray-200 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenProducts((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(item.id)) {
                            newSet.delete(item.id);
                          } else {
                            newSet.add(item.id);
                          }
                          return newSet;
                        });
                      }}
                    >
                      {openProducts.has(item.id) ? (
                        <ChevronUp className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                )}

                {/* Vista simple */}
                <div
                  className="flex flex-col sm:flex-row items-center sm:items-center gap-4 w-full pl-5"
                  onClick={() => {
                    if (isPage) return;
                    setOpenProducts((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(item.id)) {
                        newSet.delete(item.id);
                      } else {
                        newSet.add(item.id);
                      }
                      return newSet;
                    });
                  }}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="object-contain shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-center sm:text-left line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 text-center sm:text-left">
                      Precio: ${item.price.toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>

                {/* Vista detallada */}
                {(isPage || openProducts.has(item.id)) && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex-1 w-full mt-2 flex flex-row gap-6 items-start"
                  >
                    {/* Vista detallada SOLO para el producto seleccionado */}
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="p-3 text-center">Precio</th>
                            <th className="p-3 text-center">Cantidad</th>
                            <th className="p-3 text-center">Servicio</th>
                            <th className="p-3 text-center">Sub-total</th>
                            <th className="p-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-3 text-center">
                              ${item.price.toLocaleString("es-CO")}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  className="cursor-pointer transition hover:scale-110 hover:bg-red-300/60 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, -1);
                                  }}
                                >
                                  <Image
                                    src="/assets/imgs/minus.png"
                                    alt="Disminuir"
                                    width={25}
                                    height={25}
                                  />
                                </button>
                                <motion.span
                                  key={item.quantity}
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                  }}
                                >
                                  {item.quantity}
                                </motion.span>

                                <button
                                  disabled={item.quantity >= item.stock}
                                  className={`cursor-pointer transition rounded 
    ${item.quantity >= item.stock
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:scale-110 hover:bg-red-300/60"
                                    }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, 1);
                                  }}
                                >
                                  <Image
                                    src="/assets/imgs/add.png"
                                    alt="Aumentar"
                                    width={25}
                                    height={25}
                                    className="rotate-180"
                                  />
                                </button>
                                <div className="text-xs text-gray-600 mt-1">
                                  Stock disponible: {item.stock}
                                </div>

                                {item.error && (
                                  <div className="text-xs text-red-600 mt-1 font-medium">
                                    {item.error}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();

                                  // Debe estar autenticado
                                  if (!authUserId) {
                                    setError(
                                      "Debes iniciar sesión para solicitar un servicio."
                                    );
                                    return;
                                  }

                                  // Validar dirección ANTES de abrir el modal
                                  const addressValidationError = null;
                                  if (addressValidationError) {
                                    setAddressError(addressValidationError);
                                    setError("");
                                    return;
                                  }

                                  // Todo OK → activar servicio y abrir modal
                                  setAddressError("");

                                  if (!item.service) {
                                    setPendingServiceCartItemId(item.id);
                                    setSelectedServiceId(Number(item.id));
                                    setOpenServiceModal(true);
                                  } else {
                                    toggleService(item.id);
                                    setPendingServiceCartItemId(null);
                                    setSelectedServiceId(null);
                                    setOpenServiceModal(false);
                                  }
                                }}
                                className={`cursor-pointer px-3 py-1 rounded text-sm font-medium transition ${item.service
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                  }`}
                              >
                                {item.service
                                  ? "✓ Servicio incluido"
                                  : "➕ Incluir servicio"}
                              </button>
                            </td>
                            <td className="p-3 text-center">
                              $
                              {(item.price * item.quantity).toLocaleString(
                                "es-CO"
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item.id);
                                }}
                              >
                                <Image
                                  src="/assets/imgs/Boton_medio.png"
                                  alt="Eliminar"
                                  width={28}
                                  height={28}
                                  className=" transition hover:scale-110 hover:bg-red-300/60 rounded"
                                />
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        </div>

            {/* Datos cliente */}
          <div className="hidden flex-col gap-3 w-full bg-gray-50 p-4 rounded-xl shadow-inner">
            <p className="text-gray-800">
              <span className="font-semibold">Nombre:</span> Samuel Córdoba
            </p>
            <p className="text-gray-800">
              <span className="font-semibold">Cédula:</span> 1033259147
            </p>
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-gray-800">
                Dirección de envío
              </h4>

              <select
                value={address.city}
                onChange={(e) =>
                  setAddress({ ...address, city: e.target.value })
                }
                className="border rounded p-2"
              >
                <option value="">Ciudad</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={address.zone}
                onChange={(e) =>
                  setAddress({ ...address, zone: e.target.value })
                }
                className="border rounded p-2"
              >
                <option value="">Zona / Barrio</option>
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={address.streetType}
                  onChange={(e) =>
                    setAddress({ ...address, streetType: e.target.value })
                  }
                  className="border rounded p-2"
                >
                  <option value="">Tipo</option>
                  {STREET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Número"
                  value={address.streetNumber}
                  onChange={(e) =>
                    setAddress({ ...address, streetNumber: e.target.value })
                  }
                  className="border rounded p-2"
                />
              </div>

              <input
                placeholder="# secundaria (ej: 23-18)"
                value={address.secondaryNumber}
                onChange={(e) =>
                  setAddress({ ...address, secondaryNumber: e.target.value })
                }
                className="border rounded p-2"
              />

              <input
                placeholder="Complemento (Apto, Casa, Torre...)"
                value={address.complement}
                onChange={(e) =>
                  setAddress({ ...address, complement: e.target.value })
                }
                className="border rounded p-2"
              />

              {addressError && (
                <p className="text-sm text-red-600 font-medium">
                  {addressError}
                </p>
              )}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>

          </div>

          <div className="w-full xl:sticky xl:top-4">
          {/* Resumen de costos + Botón */}
          <div className="flex flex-col w-full gap-5 bg-gray-50 p-5 rounded-xl shadow-md">
            {/* Resumen */}
            <div className="space-y-2 text-right text-gray-700">
              <p className="text-left text-lg font-semibold text-gray-800 mb-3">
                Resumen de compra
              </p>
              <p className="flex justify-between text-base">
                <span className="font-medium">Subtotal:</span>
                <span>${total.toLocaleString("es-CO")}</span>
              </p>
              <p className="flex justify-between text-base">
                <span className="font-medium">Envío:</span>
                <span>$20,000</span>
              </p>
              <p className="flex justify-between text-base">
                <span className="font-medium">IVA (19%):</span>
                <span>${(total * 0.19).toLocaleString("es-CO")}</span>
              </p>
              <p className="flex justify-between text-xl font-bold border-t pt-3 text-gray-900">
                <span>Total:</span>
                <span>
                  ${(total + 20000 + total * 0.19).toLocaleString("es-CO")}
                </span>
              </p>
            </div>

            {/* Botón Comprar */}
            <div className="flex flex-col items-center mt-5 border-t pt-4">
              <p className="text-lg font-medium text-gray-700 flex items-center gap-2 mb-3 text-center">
                {hasService ? (
                  <>
                    🛠️ <span>Su solicitud de servicio será enviada</span>
                  </>
                ) : (
                  <>
                    🚚 <span>Paga ahora y recibe en 3 días</span>
                  </>
                )}
              </p>

              <button
                onClick={handlePurchase}
                disabled={isRedirectingToCheckout || cart.length === 0}
                className="cursor-pointer bg-[#2a9781] hover:bg-[#227a69] text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-md transition"
              >
                {isRedirectingToCheckout
                  ? "Redirigiendo a Mercado Pago..."
                  : hasService
                    ? "Pagar con Mercado Pago"
                    : "Pagar ahora"}
              </button>
            </div>
          </div>
        </div>
        </div>
      </motion.div>{" "}
      {authUserId > 0 && (
        <ClientCreateRequestModal
          isOpen={openServiceModal}
          onClose={() => {
            setOpenServiceModal(false);
            setPendingServiceCartItemId(null);
            setSelectedServiceId(null);
          }}
          onSave={async (payload) => {
            // Solo guardar en memoria
            setServiceDraft(payload);
            if (pendingServiceCartItemId) {
              toggleService(pendingServiceCartItemId);
            }

            showSuccess("Servicio listo. Confirma el carrito para enviarlo.");
            setPendingServiceCartItemId(null);
            setSelectedServiceId(null);
            setOpenServiceModal(false);
          }}
          clientId={authUserId}
          clientLabel={authUserNameLabel}
          clientDocumentLabel={String(customerDocument || "")}
          initialServiceId={selectedServiceId}
          initialDireccion={fullAddress}
          initialAddressFields={{
            city: address.city,
            zone: address.zone,
            streetType: address.streetType,
            streetNumber: address.streetNumber,
            secondaryNumber: address.secondaryNumber,
            complement: address.complement,
          }}
          onInitialAddressFieldsChange={(next) => setAddress(next)}
          addressOptions={{
            cities: CITIES,
            zones: ZONES,
            streetTypes: STREET_TYPES,
          }}
        />
      )}
    </div>
  );
}
