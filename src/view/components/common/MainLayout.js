import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import SideBar from '../navigation/SideBar';

const MainLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Barra Lateral Oscura y Fija */}
      <SideBar />

      {/* Área de Contenido Principal */}
      <div className="flex-1 flex flex-col ml-64"> {/* ml-64 para compensar el ancho de la SideBar */}
        
        {/* Encabezado Superior */}
        <header className="bg-white shadow-md p-4 flex justify-end items-center border-b border-slate-200 z-10">
          <div className="flex items-center space-x-4">
            <span className="text-slate-600 text-md">
              Hola, <span className="font-bold text-slate-900">{user ? user.username : 'Usuario'}</span>
            </span>
            <button
              onClick={logout}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out text-sm shadow-sm hover:shadow-md"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Contenido de la Página */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <Outlet /> {/* Las rutas hijas se renderizan aquí */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;