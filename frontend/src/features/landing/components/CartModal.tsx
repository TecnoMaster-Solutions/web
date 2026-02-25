"use client";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import ClientCreateRequestModal from "@/features/dashboard/requests/components/ClientRequestModal";
import { useCreateServiceRequest } from "@/features/dashboard/requests/hooks/useServiceRequests";
import { showSuccess, showError } from "@/shared/utils/notifications";
import { createSale } from "@/features/dashboard/sales/api/sales.api";
import Swal from "sweetalert2";

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
  isOpen: boolean;
  onClose: () => void;
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
  userId,
}: {
  cart: typeof cart;
  userId: number;
}) {
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const taxpercent = 19;
  const taxamount = Math.round((subtotal * taxpercent) / 100);

  return {
    customerid: userId,
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

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const [openProducts, setOpenProducts] = useState<Set<number>>(new Set());
  const [addressError, setAddressError] = useState("");
  const [error, setError] = useState("");
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  const createRequestMut = useCreateServiceRequest();
  const [serviceDraft, setServiceDraft] = useState<CreateRequestPayload | null>(
    null
  );

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );

  const [address, setAddress] = useState({
    city: "",
    zone: "",
    streetType: "",
    streetNumber: "",
    secondaryNumber: "",
    complement: "",
  });

  const { cart, updateQuantity, toggleService, removeFromCart } = useCart();

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

  if (!isOpen) return null;

  const hasService = cart.some((item) => item.service);
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

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
    const validationError = validateAddress();
    if (validationError) {
      setAddressError(validationError);
      return;
    }

    if (!authUser) {
      showError("Usuario no autenticado.");
      return;
    }

    try {
      // Crear solicitud de servicio (si existe)
      if (hasService && serviceDraft) {
        await createRequestMut.mutateAsync(serviceDraft);
      }

      // Crear venta
      const salePayload = buildSalePayload({
        cart,
        userId: authUser.userid,
      });

      await createSale(salePayload);

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

      // Mostrar Sweet Alert antes de redireccionar
      await Swal.fire({
        title: "¡Compra Exitosa!",
        text: "La venta y solicitud de servicio han sido creadas correctamente.",
        icon: "success",
        confirmButtonText: "Continuar",
        confirmButtonColor: "#dc2626",
        timer: 3000,
        timerProgressBar: true,
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });

      window.location.href = "/payments/register";
      onClose();
    } catch (err) {
      showError("No se pudo completar la compra.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 z-50 max-h-[95vh] overflow-y-auto scroll-smooth"
      >
        {/* Botón cerrar */}
        <button
          className="cursor-pointer absolute top-4 right-4 text-gray-700 hover:text-black"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-3xl font-semibold mb-6">Tu carrito</h2>

        {/* productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-96 overflow-y-auto pr-2">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{
                  boxShadow: "0px 10px 25px rgba(139, 0, 0, 0.7)",
                }}
                whileTap={{ scale: 0.97 }}
                layout
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={`cursor-pointer bg-gray-50 rounded-xl shadow-md hover:shadow-xl p-4 relative
  ${openProducts.has(item.id)
                    ? "flex flex-col md:flex-row gap-6 items-start md:col-span-3"
                    : "flex flex-col items-center"
                  }`}
              >
                {/* Flecha de despliegue - arriba a la izquierda */}
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

                {/* Vista simple */}
                <div
                  className="flex flex-col items-center justify-between w-full md:w-40"
                  onClick={() => {
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
                  <p className="mt-2 font-medium text-gray-800 text-center">
                    {item.name}
                  </p>
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="object-contain mt-2"
                  />
                </div>

                {/* Vista detallada */}
                {openProducts.has(item.id) && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex-1 w-full md:w-auto mt-4 md:mt-0 flex flex-row gap-6 items-start"
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
                                  if (!authUser) {
                                    setError(
                                      "Debes iniciar sesión para solicitar un servicio."
                                    );
                                    return;
                                  }

                                  // Validar dirección ANTES de abrir el modal
                                  const addressValidationError =
                                    validateAddress();
                                  if (addressValidationError) {
                                    setAddressError(addressValidationError);
                                    setError("");
                                    return;
                                  }

                                  // Todo OK → activar servicio y abrir modal
                                  setAddressError("");

                                  toggleService(item.id);

                                  if (!item.service) {
                                    setSelectedServiceId(Number(item.id));
                                    setOpenServiceModal(true);
                                  } else {
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

        {/* Datos + Total */}
        <div className="flex flex-col lg:flex-row justify-between items-start mt-8 gap-6">
          {/* Datos cliente */}
          <div className="flex flex-col gap-3 w-full lg:w-1/2 bg-gray-50 p-4 rounded-xl shadow-inner">
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

          {/* Resumen de costos + Botón */}
          <div className="flex flex-col w-full lg:w-1/2 gap-5 bg-gray-50 p-5 rounded-xl shadow-md">
            {/* Resumen */}
            <div className="space-y-2 text-right text-gray-700">
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
            <div className="flex flex-col items-center mt-5">
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
                className="cursor-pointer bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-md transition"
              >
                {hasService ? "Confirmar servicio" : "Comprar"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>{" "}
      {authUser && (
        <ClientCreateRequestModal
          isOpen={openServiceModal}
          onClose={() => {
            setOpenServiceModal(false);
            setSelectedServiceId(null);
          }}
          onSave={async (payload) => {
            // Solo guardar en memoria
            setServiceDraft(payload);

            showSuccess("Servicio listo. Confirma el carrito para enviarlo.");
            setOpenServiceModal(false);
          }}
          clientId={authUser.userid}
          clientLabel={authUser.name}
          initialServiceId={selectedServiceId}
          initialDireccion={fullAddress}
        />
      )}
    </div>
  );
}
