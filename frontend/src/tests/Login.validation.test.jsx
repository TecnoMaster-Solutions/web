import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "@/features/auth/login/login";
import { AuthProvider } from "@/features/auth/authcontext";
import { CartProvider } from "@/features/landing/contexts/CartContext";

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    };
  },
}));

describe("Login Validation", () => {

  function renderLogin() {
    return render(
      <CartProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </CartProvider>
    );
  }

  test("muestra error si el login se envía vacío", async () => {

    renderLogin();

    const boton = screen.getByTestId("login-button");

    await userEvent.click(boton);

    const error = await screen.findByText(/correo/i);

    expect(error).toBeInTheDocument();
  });

  test("muestra error si el email es inválido", async () => {

    renderLogin();

    const emailInput = screen.getByPlaceholderText(/correo/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const boton = screen.getByTestId("login-button");

    await userEvent.type(emailInput, "correo-invalido");
    await userEvent.type(passwordInput, "123456");

    await userEvent.click(boton);

    const error = await screen.findByText(/correo/i);

    expect(error).toBeInTheDocument();
  });

});