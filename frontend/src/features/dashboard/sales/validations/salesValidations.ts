import * as Yup from "yup";


  // TIPOS AUXILIARES
export interface CartItem {
  productid: number;
  productname: string;
  quantity: number;
  unitprice: number;
  productstock?: number;
}


   //VALIDACIÓN ITEMS
const cartItemSchema = Yup.object().shape({
  productid: Yup.number()
    .required("El producto es obligatorio")
    .positive("Producto inválido"),

  productname: Yup.string().required(),

  quantity: Yup.number()
    .required("La cantidad es obligatoria")
    .integer("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor que 0"),

  unitprice: Yup.number()
    .required("El precio unitario es obligatorio")
    .positive("El precio unitario debe ser mayor que 0"),

  productstock: Yup.number()
    .nullable()
    .notRequired()
    .test(
      "stock",
      "Cantidad supera el stock disponible",
      function (value) {
        const quantity = (this.parent as any).quantity;
        if (value === undefined || value === null) return true;
        return quantity <= value;
      }
    ),
});


  // VALIDACIÓN FORMULARIO
export const saleValidationSchema = Yup.object({
  salecode: Yup.string()
    .trim()
    .required("El código de venta es obligatorio"),

  customerid: Yup.number()
    .typeError("Debe seleccionar un cliente")
    .required("Debe seleccionar un cliente")
    .positive("Cliente inválido"),

  saledate: Yup.date()
    .required("La fecha de venta es obligatoria")
    .max(new Date(), "La fecha de venta no puede ser futura"),

  paymentmethod: Yup.string()
    .required("Debe seleccionar un método de pago")
    .oneOf(
      ["Efectivo", "Transferencia", "Tarjeta"],
      "Método de pago inválido"
    ),

  notes: Yup.string()
    .max(300, "Las observaciones no pueden superar los 300 caracteres")
    .nullable(),

  cart: Yup.array()
    .of(cartItemSchema)
    .min(1, "Debe agregar al menos un producto")
    .test(
      "no-duplicates",
      "No puede agregar el mismo producto más de una vez",
      (cart) => {
        if (!cart) return true;
        const ids = cart.map((i) => i.productid);
        return new Set(ids).size === ids.length;
      }
    ),
});
