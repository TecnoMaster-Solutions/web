import { render, screen } from "@testing-library/react";
import Login from "@/features/auth/login/login";
import { AuthProvider } from "@/features/auth/authcontext";

// Mock router de Next
jest.mock("next/navigation", () => ({
  useRouter() {
    return { push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() };
  },
  useSearchParams() {
    return { get: jest.fn() };
  },
}));

// Mock carrito
jest.mock("@/features/landing/contexts/CartContext", () => ({
  useCart: () => ({
    cart: [],
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
    totalItems: 0,
    totalPrice: 0,
  }),
}));

describe("Login Render", () => {
  test("renderiza el formulario de login", () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });
});