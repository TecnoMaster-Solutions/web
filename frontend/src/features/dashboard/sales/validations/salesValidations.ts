import * as Yup from "yup";

export interface CartItem {
  productid: number;
  productname: string;
  quantity: number;
  unitprice: number;
  productstock?: number | null;
}

type CartItemSchemaContext = {
  quantity?: number;
};

const cartItemSchema: Yup.ObjectSchema<CartItem> = Yup.object({
  productid: Yup.number()
    .required("El producto es obligatorio")
    .positive("Producto invalido"),
  productname: Yup.string().required(),
  quantity: Yup.number()
    .required("La cantidad es obligatoria")
    .integer("La cantidad debe ser un numero entero")
    .positive("La cantidad debe ser mayor que 0"),
  unitprice: Yup.number()
    .required("El precio unitario es obligatorio")
    .positive("El precio unitario debe ser mayor que 0"),
  productstock: Yup.number()
    .nullable()
    .notRequired()
    .test("stock", "Cantidad supera el stock disponible", function (value?: number | null) {
      const quantity = (this.parent as CartItemSchemaContext).quantity ?? 0;
      if (value === undefined || value === null) return true;
      return quantity <= value;
    }),
});

export const saleValidationSchema = Yup.object({
  salecode: Yup.string()
    .trim()
    .required("El codigo de venta es obligatorio"),
  customerid: Yup.number()
    .typeError("Debe seleccionar un cliente")
    .required("Debe seleccionar un cliente")
    .positive("Cliente invalido"),
  saledate: Yup.date()
    .required("La fecha de venta es obligatoria")
    .max(new Date(), "La fecha de venta no puede ser futura"),
  paymentmethod: Yup.string()
    .required("Debe seleccionar un metodo de pago")
    .oneOf(["Efectivo", "Transferencia", "Tarjeta"], "Metodo de pago invalido"),
  notes: Yup.string()
    .max(300, "Las observaciones no pueden superar los 300 caracteres")
    .nullable(),
  cart: Yup.array()
    .of(cartItemSchema)
    .min(1, "Debe agregar al menos un producto")
    .test(
      "no-duplicates",
      "No puede agregar el mismo producto mas de una vez",
      (cart?: CartItem[]) => {
        if (!cart) return true;
        const ids = cart.map((item) => item.productid);
        return new Set(ids).size === ids.length;
      },
    ),
});
