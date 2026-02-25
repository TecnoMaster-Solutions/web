"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  service: boolean;
  image: string;
  error?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity" | "service" | "error">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  toggleService: (id: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (
    item: Omit<CartItem, "quantity" | "service" | "error">
  ) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);

      if (existing) {
        if (existing.quantity >= existing.stock) {
          return prev.map((p) =>
            p.id === item.id
              ? { ...p, error: `Stock máximo disponible: ${p.stock}` }
              : p
          );
        }

        return prev.map((p) =>
          p.id === item.id
            ? { ...p, quantity: p.quantity + 1, error: undefined }
            : p
        );
      }

      return [
        ...prev,
        { ...item, quantity: 1, service: false, error: undefined },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const nextQty = item.quantity + delta;

        if (nextQty < 1) {
          return item;
        }

        if (nextQty > item.stock) {
          return {
            ...item,
            error: `Solo hay ${item.stock} unidades disponibles`,
          };
        }

        return {
          ...item,
          quantity: nextQty,
          error: undefined,
        };
      })
    );
  };

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((item) => item.id !== id));

  const toggleService = (id: string) =>
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, service: !item.service } : item
      )
    );

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, toggleService }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
