import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  MemoryRouter: ({ children }) => <div>{children}</div>,
  Link: ({ children, to }) => <a href={to || '#'}>{children}</a>,
}));

jest.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

import { MemoryRouter } from 'react-router-dom';
import LoginScreen from '../LoginScreen';

test('renders login form fields', () => {
  render(
    <MemoryRouter>
      <LoginScreen />
    </MemoryRouter>
  );

  // Verifica el título
  expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();

  // Verifica los campos del formulario
  expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();

  // Verifica el botón
  expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
});
