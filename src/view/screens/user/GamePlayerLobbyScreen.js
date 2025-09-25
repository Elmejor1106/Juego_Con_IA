import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { User, Users, ArrowLeft } from 'lucide-react';

const GamePlayerLobbyScreen = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const handlePlaySolo = () => {
    navigate(`/play/${gameId}`);
  };

  const handleInvitePlayers = () => {
    // TODO: Implement invite players functionality
    alert('Funcionalidad de invitar jugadores aún no implementada.');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="absolute top-4 left-4">
        <Button onClick={() => navigate(-1)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg flex items-center gap-2">
          <ArrowLeft size={20} /> Volver
        </Button>
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Jugar Juego #{gameId}</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <Button 
          onClick={handlePlaySolo} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg flex items-center justify-center gap-3 text-xl"
        >
          <User size={28} /> Jugar Solo
        </Button>
        <Button 
          onClick={handleInvitePlayers} 
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg flex items-center justify-center gap-3 text-xl"
        >
          <Users size={28} /> Invitar Jugadores
        </Button>
      </div>
    </div>
  );
};

export default GamePlayerLobbyScreen;
