import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Este componente actúa como un "guardián" para las rutas de administrador.
 * Comprueba si el usuario está autenticado y tiene el rol de 'admin'.
 * Si es así, renderiza las rutas hijas (a través de <Outlet />).
 * Si no, redirige al usuario a la página de inicio.
 */
const AdminNavigator = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Outlet />;
  } else {
    return <Navigate to="/" replace />;
  }
};

export default AdminNavigator;