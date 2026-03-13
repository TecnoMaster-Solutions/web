import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/auth/login/page';

jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));
const loginMock = jest.fn();
jest.mock('@/features/auth/authcontext', () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));
jest.mock('@/features/landing/layout/Nav', () => {
  return function MockNav() {
    return <div>Nav</div>;
  };
});
jest.mock('@/shared/utils/notifications', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));
jest.mock('@/shared/routes', () => ({
  routes: {
    auth: {
      forgotPassword: '/auth/forgot-password',
    },
  },
}));

describe('Login.validation', () => {
  it('muestra validaciones si se envía vacío', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(
      screen.getByText('El correo electrónico es obligatorio')
    ).toBeInTheDocument();
    expect(
      screen.getByText('La contraseña es obligatoria')
    ).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('muestra validación si el correo es inválido', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Contraseña');

    await user.type(emailInput, 'correo-invalido');
    await user.type(passwordInput, '123456');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(
      screen.getByText('Ingresa un correo electrónico válido')
    ).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });
});