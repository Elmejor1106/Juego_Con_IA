import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import GameService from '../../../model/business_logic/services/GameService'; // Importar GameService
import Button from '../../components/common/Button';

const GamePlayerScreen = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      const result = await GameViewModel.getGameById(gameId);
      if (result.success) {
        setGame(result.game);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchGame();
  }, [gameId]);

  // Log game play when component mounts
  useEffect(() => {
    GameService.logGamePlay(gameId);
  }, [gameId]);

  const handleAnswerSelect = (answer) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    if (answer.is_correct) {
      setScore(prevScore => prevScore + 1);
    }
  };

  const handleNextQuestion = () => {
    setIsAnswered(false);
    setSelectedAnswer(null);
    setCurrentQuestionIndex(prevIndex => prevIndex + 1);
  };

  const handleRestartGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  if (loading) {
    return <div className="text-center p-10 text-slate-500">Cargando juego...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-600 bg-red-100 border border-red-200 rounded-lg">{error}</div>;
  }

  if (!game || !game.questions || game.questions.length === 0) {
    return (
        <div className="text-center p-10 bg-white rounded-lg shadow-md border">
            <h2 className="text-2xl font-bold mb-4 text-slate-700">Juego no disponible</h2>
            <p className="text-slate-500 mb-6">Este juego no se pudo cargar o no contiene preguntas.</p>
            <Button onClick={() => navigate('/user-games')} className="bg-slate-500 hover:bg-slate-600 text-white">
                Volver a Mis Juegos
            </Button>
        </div>
    );
  }

  const isGameFinished = currentQuestionIndex >= game.questions.length;
  const currentQuestion = game.questions[currentQuestionIndex];

  // Pantalla de Puntuación Final
  if (isGameFinished) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-xl shadow-2xl text-center border border-slate-200 fade-in">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">¡Juego Terminado!</h1>
        <p className="text-xl text-slate-600 mb-6">
          Tu puntuación final es:
        </p>
        <p className="text-6xl font-bold text-sky-600 mb-8">
          {score} / {game.questions.length}
        </p>
        <div className="flex justify-center space-x-4">
          <Button onClick={handleRestartGame} className="bg-sky-500 hover:bg-sky-600 text-white shadow-md">Jugar de Nuevo</Button>
          <Button onClick={() => navigate('/user-games')} className="bg-slate-500 hover:bg-slate-600 text-white shadow-md">
            Ver otros juegos
          </Button>
        </div>
      </div>
    );
  }

  // Pantalla de Juego
  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Encabezado */}
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold truncate pr-4">{game.title}</h1>
            <div className="text-lg font-semibold flex-shrink-0">Puntuación: {score}</div>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2.5">
            <div 
              className="bg-sky-400 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentQuestionIndex + 1) / game.questions.length) * 100}%` }}
            ></div>
          </div>
          <div className="text-right mt-1 text-sm text-slate-300">
            Pregunta {currentQuestionIndex + 1} de {game.questions.length}
          </div>
        </div>

        {/* Pregunta */}
        <div className="p-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 text-center mb-8 min-h-[100px]">
            {currentQuestion.question_text}
          </h2>

          {/* Respuestas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.answers.map(answer => {
              const isSelected = selectedAnswer?.id === answer.id;
              let buttonClass = 'bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-700';
              if (isAnswered) {
                if (answer.is_correct) {
                  buttonClass = 'bg-emerald-500 border-emerald-500 text-white font-bold shadow-lg'; // Correcta
                } else if (isSelected) {
                  buttonClass = 'bg-red-500 border-red-500 text-white font-bold shadow-lg'; // Incorrecta seleccionada
                } else {
                  buttonClass = 'bg-slate-200 border-slate-200 text-slate-500 opacity-70'; // Otra incorrecta
                }
              }

              return (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-lg text-lg transition-all duration-300 transform ${!isAnswered && 'hover:scale-105 hover:border-sky-400'} ${buttonClass}`}
                >
                  {answer.answer_text}
                </button>
              );
            })}
          </div>

          {/* Botón Siguiente */}
          {isAnswered && (
            <div className="mt-8 text-center">
              <Button onClick={handleNextQuestion} className="px-10 py-3 text-xl bg-sky-500 hover:bg-sky-600 text-white animate-pulse shadow-lg">
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePlayerScreen;