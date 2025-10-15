import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserViewModel from '../../../viewModel/user/UserViewModel';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import Button from '../../components/common/Button';
import GameCard from '../../components/game/GameCard';

// Componente para las tarjetas de estadísticas del dashboard
const StatCard = ({ title, value, icon, color, loading }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 border-l-4" style={{borderColor: color}}>
    <div className="p-3 rounded-full" style={{backgroundColor: `${color}1A`}}> 
      <div style={{color: color}}>{icon}</div>
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      {loading ? (
        <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
      ) : (
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      )}
    </div>
  </div>
);

// Iconos SVG para las tarjetas
const GamepadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const HomeScreen = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [publicGames, setPublicGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      console.log('🔍 [STATS DEBUG] HomeScreen: Iniciando carga de datos');
      setLoading(true);
      // Fetch stats
      const statsResult = await UserViewModel.fetchDashboardStats();
      console.log('🔍 [STATS DEBUG] HomeScreen: Resultado de estadísticas:', statsResult);
      if (statsResult.success) {
        console.log('🔍 [STATS DEBUG] HomeScreen: Estableciendo stats:', statsResult.data);
        setStats(statsResult.data);
      } else {
        console.error('🔍 [STATS DEBUG] HomeScreen: Error obteniendo stats:', statsResult.message);
      }
      // Fetch public games
      const gamesResult = await GameViewModel.fetchPublicGames();
      if (gamesResult.success) {
        setPublicGames(gamesResult.games.slice(0, 3)); // Get first 3 games
      }
      setLoading(false);
      console.log('🔍 [STATS DEBUG] HomeScreen: Estado final stats:', stats);
    };
    loadData();
  }, []);

  const handlePlayGame = (gameId) => {
    navigate(`/play/${gameId}`);
  };

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Bienvenido de nuevo. Aquí tienes un resumen de tu actividad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {console.log('🔍 [STATS DEBUG] HomeScreen: Renderizando tarjetas - stats:', stats, 'gamesCreated:', stats?.gamesCreated, 'gamesPlayed:', stats?.gamesPlayed)}
        <StatCard title="Juegos Creados" value={stats?.gamesCreated ?? 0} icon={<GamepadIcon />} color="#3B82F6" loading={loading} />
        <StatCard title="Partidas Jugadas" value={stats?.gamesPlayed ?? 0} icon={<PlayIcon />} color="#10B981" loading={loading} />
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Juegos Públicos Recientes</h2>
          <Link to="/public-games" className="text-sm font-medium text-sky-600 hover:text-sky-700">Ver todos</Link>
        </div>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicGames.map(game => (
              <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Acciones Rápidas</h2>
        <div className="flex space-x-4">
            <Button onClick={() => navigate('/create-game')} className="bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg">Crear Nuevo Juego</Button>
            <Button onClick={() => navigate('/user-games')} className="bg-slate-700 hover:bg-slate-800 text-white shadow-md hover:shadow-lg">Ver Mis Juegos</Button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;