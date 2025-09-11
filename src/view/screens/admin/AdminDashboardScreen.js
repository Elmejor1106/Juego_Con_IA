import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import AdminViewModel from '../../../viewModel/admin/AdminViewModel';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const DashboardProfileSection = ({ user }) => (
  <Card className="flex flex-col md:flex-row items-center gap-6 p-8 bg-gradient-to-r from-indigo-50 to-pink-50 shadow-lg">
    <div className="flex flex-col items-center md:items-start gap-2">
      <div className="bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full w-24 h-24 flex items-center justify-center shadow-md">
        <span className="text-white text-4xl font-bold select-none">
          {user?.username?.[0]?.toUpperCase() || 'A'}
        </span>
      </div>
      <div className="mt-2 text-center md:text-left">
        <h2 className="text-2xl font-bold text-indigo-700 mb-1">{user?.username || 'Admin'}</h2>
        <p className="text-gray-500 text-sm">{user?.email || 'cargando...'}</p>
      </div>
    </div>
    <div className="flex flex-col gap-3 items-center md:items-end flex-1">
      <Button className="btn px-6 py-2">Ver Perfil</Button>
      <span className="text-xs text-gray-400">Rol: {user?.role || 'admin'}</span>
    </div>
  </Card>
);

const DashboardStatsSection = ({ stats, loading, error }) => {
  if (loading) {
    return <p>Cargando estadísticas...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error al cargar estadísticas: {error}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <Card className="flex flex-col items-center justify-center p-6">
        <span className="text-3xl font-bold text-indigo-500">{stats?.totalUsers ?? 0}</span>
        <span className="text-gray-500 mt-2">Usuarios Totales</span>
      </Card>
      <Card className="flex flex-col items-center justify-center p-6">
        <span className="text-3xl font-bold text-pink-500">{stats?.totalGames ?? 0}</span>
        <span className="text-gray-500 mt-2">Juegos Totales</span>
      </Card>
      <Card className="flex flex-col items-center justify-center p-6">
        <span className="text-3xl font-bold text-green-500">{stats?.totalPlays ?? 0}</span>
        <span className="text-gray-500 mt-2">Partidas Totales</span>
      </Card>
    </div>
  );
};

const AdminDashboardScreen = () => {
  const { user } = useAuth(); // Obtener el usuario real del contexto
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getStats = async () => {
      setLoading(true);
      const result = await AdminViewModel.fetchDashboardStats();
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.message);
      }
      setLoading(false);
    };

    getStats();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <DashboardProfileSection user={user} />
      <DashboardStatsSection stats={stats} loading={loading} error={error} />
    </div>
  );
};

export default AdminDashboardScreen;