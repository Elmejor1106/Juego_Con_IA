import React, { useState, useEffect, useCallback } from 'react';
import ReportsViewModel from '../../../viewModel/admin/ReportsViewModel';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const SystemReportsScreen = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const result = await ReportsViewModel.fetchAdminDashboardData();
    if (result.success) {
      setGames(result.data.games || []);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteGame = async (gameId) => {
    const isConfirmed = window.confirm('¿Estás seguro de que quieres eliminar este juego? Esta acción no se puede deshacer.');
    if (isConfirmed) {
      const result = await ReportsViewModel.deleteGame(gameId);
      if (result.success) {
        alert('Juego eliminado con éxito.');
        loadData(); // Recargar los datos
      } else {
        alert(`Error al eliminar el juego: ${result.error}`);
      }
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p>Cargando datos del sistema...</p>;
    }

    if (error) {
      return <p className="text-red-500">Error al cargar los datos: {error}</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-sm">Nombre del Juego</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Autor</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Categoría</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Fecha de Creación</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {games.length > 0 ? games.map((game) => (
              <tr key={game.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{game.name}</td>
                <td className="py-3 px-4">{game.username}</td>
                <td className="py-3 px-4">{game.category}</td>
                <td className="py-3 px-4">{new Date(game.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <Button onClick={() => handleDeleteGame(game.id)} >
                    Eliminar
                  </Button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="text-center py-4">No hay juegos registrados en el sistema.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Panel de Administración de Juegos</h1>
        {renderContent()}
      </Card>
    </div>
  );
};

export default SystemReportsScreen;
