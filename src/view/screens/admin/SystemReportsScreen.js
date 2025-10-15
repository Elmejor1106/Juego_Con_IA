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

  const handleDownloadReport = async () => {
    try {
      const result = await ReportsViewModel.downloadUserReport();
      if (result.success) {
        // Crear un Blob con la respuesta del PDF
        const blob = new Blob([result.data], { type: 'application/pdf' });
        // Crear una URL para el Blob
        const url = window.URL.createObjectURL(blob);
        // Crear un enlace temporal para iniciar la descarga
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'reporte_usuarios.pdf');
        document.body.appendChild(link);
        link.click();
        // Limpiar
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert(`Error al generar el reporte: ${result.error}`);
      }
    } catch (error) {
      alert(`Error inesperado al descargar el reporte: ${error.message}`);
    }
  };

  const handleDownloadImageReport = async () => {
    try {
      const result = await ReportsViewModel.downloadImageReport();
      if (result.success) {
        const blob = new Blob([result.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'reporte_actividad_imagenes.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert(`Error al generar el reporte de imágenes: ${result.error}`);
      }
    } catch (error) {
      alert(`Error inesperado al descargar el reporte de imágenes: ${error.message}`);
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
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Generación de Informes</h1>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <p>Descargar informe completo de usuarios del sistema:</p>
            <Button onClick={handleDownloadReport}>Descargar PDF de Usuarios</Button>
          </div>
          <div className="flex items-center space-x-4">
            <p>Descargar informe de actividad de imágenes:</p>
            <Button onClick={handleDownloadImageReport} className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg">Generar Reporte de Imágenes</Button>
          </div>
        </div>
      </Card>

      <Card>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Panel de Administración de Juegos</h1>
        {renderContent()}
      </Card>
    </div>
  );
};

export default SystemReportsScreen;
