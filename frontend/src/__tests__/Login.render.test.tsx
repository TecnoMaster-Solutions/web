import { render, screen } from '@testing-library/react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import LoginPage from '@/app/auth/login/page';

type MockImageProps = ComponentPropsWithoutRef<'img'>;
type MockLinkProps = {
  children: ReactNode;
  href: string;
};

jest.mock('next/image', () => {
  function MockNextImage(props: MockImageProps) {
    return <img alt={props.alt ?? ''} {...props} />;
  }

  MockNextImage.displayName = 'MockNextImage';
  return MockNextImage;
});

jest.mock('next/link', () => {
  function MockNextLink({ children, href }: MockLinkProps) {
    return <a href={href}>{children}</a>;
  }

  MockNextLink.displayName = 'MockNextLink';
  return MockNextLink;
});
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));
jest.mock('@/features/auth/authcontext', () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
}));
jest.mock('@/features/landing/layout/Nav', () => {
  return function MockNav() {
    return <div data-testid="nav">Nav</div>;
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

describe('Login.render', () => {
  it('renderiza el formulario de login correctamente', () => {
    render(<LoginPage />);

    expect(screen.getByText('Bienvenido a TecnoMaster')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /iniciar sesión/i })
    ).toBeInTheDocument();
  });
});
