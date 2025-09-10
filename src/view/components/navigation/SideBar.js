import React from 'react';
import { NavLink } from 'react-router-dom';

// Iconos SVG para un look profesional sin dependencias externas
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const GameIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0l3 3m0 0l3-3m-3 3V4" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const SideBar = () => {
  const commonClasses = 'flex items-center px-4 py-3 rounded-lg transition-colors duration-200';
  const activeClass = 'bg-sky-500 text-white font-bold shadow-lg';
  const inactiveClass = 'text-slate-300 hover:bg-slate-700 hover:text-white';

  return (
    <aside className="w-64 h-screen bg-slate-800 text-white flex flex-col fixed shadow-2xl">
      {/* Logo / Título */}
      <div className="flex items-center justify-center h-20 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">JuegoRápido</h1>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 px-4 py-6">
        <ul>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `${commonClasses} ${isActive ? activeClass : inactiveClass}`}
            >
              <HomeIcon />
              <span className="ml-4">Inicio</span>
            </NavLink>
          </li>
          <li className="mt-3">
            <NavLink
              to="/user-games"
              className={({ isActive }) => `${commonClasses} ${isActive ? activeClass : inactiveClass}`}
            >
              <GameIcon />
              <span className="ml-4">Mis Juegos</span>
            </NavLink>
          </li>
          <li className="mt-3">
            <NavLink
              to="/create-game"
              className={({ isActive }) => `${commonClasses} ${isActive ? activeClass : inactiveClass}`}
            >
              <PlusIcon />
              <span className="ml-4">Crear Juego</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Footer de la Sidebar (opcional) */}
      <div className="h-20 border-t border-slate-700 flex items-center justify-center">
        <p className="text-xs text-slate-400">© 2025 JuegoRápido</p>
      </div>
    </aside>
  );
};

export default SideBar;