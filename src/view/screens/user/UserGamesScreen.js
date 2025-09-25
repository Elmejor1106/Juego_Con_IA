import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import GameCard from '../../components/game/GameCard';
import Button from '../../components/common/Button';

const UserGamesScreen = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadGames = useCallback(async () => {
    setIsLoading(true);
    const result = await GameViewModel.fetchMyGames();
    if (result.success) {
      setGames(result.games);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadGames();

    const handleFocus = () => {
      loadGames();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadGames]);

  const handleEditGame = (gameId) => {
    navigate(`/edit-game/${gameId}`);
  };

  const handleDeleteGame = async (gameId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este juego? Esta acción no se puede deshacer.')) {
      const result = await GameViewModel.deleteGame(gameId);
      if (result.success) {
        alert('Juego eliminado con éxito.');
        loadGames(); // Recargar la lista de juegos
      } else {
        alert(`Error al eliminar el juego: ${result.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="container mx-auto">
        {/* Encabezado de la Página */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Mis Juegos</h1>
            <p className="text-slate-500 mt-1">
              Aquí puedes ver, editar y jugar a todos los juegos que has creado.
            </p>
          </div>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link to="/create-game">
              <Button className="bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg">
                Crear Nuevo Juego
              </Button>
            </Link>
            <Link to="/create-ai-game">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white shadow-md hover:shadow-lg ">
                Crear Juego con IA
              </Button>
            </Link>
          </div>
        </div>

        {isLoading && <p className="text-center text-slate-500">Cargando juegos...</p>}
        
        {error && <p className="text-red-600 text-center bg-red-100 p-4 rounded-lg border border-red-200">{error}</p>}

        {!isLoading && !error && (
          <div>
            {games.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {games.map(game => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    onEdit={handleEditGame} 
                    onDelete={handleDeleteGame} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md border">
                <h2 className="text-xl font-bold text-slate-700 mb-2">No has creado ningún juego todavía</h2>
                <p className="text-slate-500 mb-6">¡Haz clic en uno de los botones para empezar a crear tu primer juego!</p>
                <div className="flex justify-center gap-4">
                  <Link to="/create-game">
                    <Button className="bg-sky-500 hover:bg-sky-600 text-white ">
                      Crear mi primer juego
                    </Button>
                  </Link>
                  <Link to="/create-ai-game">
                    <Button className="bg-teal-500 hover:bg-teal-600 text-white">
                      Crear juego con IA
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserGamesScreen;