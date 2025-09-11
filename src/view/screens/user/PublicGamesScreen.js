import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import GameCard from '../../components/game/GameCard';

const PublicGamesScreen = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPublicGames = useCallback(async () => {
    setIsLoading(true);
    const result = await GameViewModel.fetchPublicGames();
    if (result.success) {
      setGames(result.games);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPublicGames();
  }, [loadPublicGames]);

  const handlePlayGame = (gameId) => {
    navigate(`/play/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Juegos Públicos</h1>
          <p className="text-slate-500 mt-1">
            Explora y juega los juegos creados por otros usuarios.
          </p>
        </div>

        {isLoading && <p className="text-center text-slate-500">Cargando juegos públicos...</p>}
        
        {error && <p className="text-red-600 text-center bg-red-100 p-4 rounded-lg border border-red-200">{error}</p>}

        {!isLoading && !error && (
          <div>
            {games.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {games.map(game => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    onPlay={handlePlayGame}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md border">
                <h2 className="text-xl font-bold text-slate-700 mb-2">No hay juegos públicos disponibles</h2>
                <p className="text-slate-500">Vuelve a intentarlo más tarde.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicGamesScreen;