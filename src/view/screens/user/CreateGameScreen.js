import React from 'react';
import { Link } from 'react-router-dom';

const CreateGameScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Link to="/create-ai-game">
        <button className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-8xl py-24 px-32 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
          Crear juego con IA
        </button>
      </Link>
    </div>
  );
};

export default CreateGameScreen;