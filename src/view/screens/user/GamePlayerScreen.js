import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import GameService from '../../../model/business_logic/services/GameService';
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
  const [countdown, setCountdown] = useState(60); // Default 60 seconds
  const [timerActive, setTimerActive] = useState(false);
  const [styles, setStyles] = useState({
    containerBg: '#ffffff',
    questionText: '#1f2937',
    answerBg: '#f3f4f6',
    answerTextColor: '#1f2937',
    buttonRadius: 8,
    timerBg: '#EF4444',
    timerTextColor: '#FFFFFF',
  });

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < game.questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setCountdown(60); // Reset timer for new question
        setTimerActive(true);
        setIsAnswered(false);
        setSelectedAnswer(null);
    } else {
        // Game finished
        setTimerActive(false);
    }
  }, [currentQuestionIndex, game]);

  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      const result = await GameViewModel.getGameById(gameId);
      if (result.success) {
        const fetchedGame = result.game;
        let loadedStyles = {};
        if (fetchedGame.styles) {
            if (typeof fetchedGame.styles === 'string') {
                try {
                    loadedStyles = JSON.parse(fetchedGame.styles);
                } catch (e) {
                    console.error("Failed to parse styles JSON:", e);
                }
            } else {
                loadedStyles = fetchedGame.styles;
            }
        }
        setStyles(prevStyles => ({...prevStyles, ...loadedStyles}));

        if (fetchedGame.game_state) {
            try {
                const gameState = JSON.parse(fetchedGame.game_state);
                if (gameState.questions && Array.isArray(gameState.questions)) {
                    const processedGame = {
                        ...fetchedGame,
                        questions: gameState.questions
                    };
                    setGame(processedGame);
                } else {
                    setGame(fetchedGame);
                }
            } catch (e) {
                console.error("Failed to parse game_state:", e);
                setGame(fetchedGame); // Fallback to original game object on error
            }
        } else {
            setGame(fetchedGame);
        }
        setTimerActive(true); // Start timer when game loads
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

  // Timer logic
  useEffect(() => {
    if (timerActive && countdown > 0) {
        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    } else if (countdown === 0 && game && currentQuestionIndex < game.questions.length) {
        // Time's up, move to next question
        handleNextQuestion();
    }
  }, [countdown, timerActive, game, currentQuestionIndex, handleNextQuestion]);

  // Reset timer and states when question changes
  useEffect(() => {
    if (game && game.questions && game.questions.length > 0) {
        setCountdown(60); // Reset timer for new question
        setTimerActive(true);
        setIsAnswered(false);
        setSelectedAnswer(null);
    }
  }, [currentQuestionIndex, game]);

  const handleAnswerSelect = (answer) => {
    if (isAnswered) return;

    setTimerActive(false); // Stop timer on answer

    setSelectedAnswer(answer);
    setIsAnswered(true);

    if (answer.is_correct) {
      setScore(prevScore => prevScore + 1);
    }

    // Automatically move to next question after a delay
    setTimeout(() => {
        handleNextQuestion();
    }, 1500); // 1.5 second delay to show feedback
  };

  const handleRestartGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCountdown(60);
    setTimerActive(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-slate-500">Cargando juego...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-red-600 bg-red-100 border border-red-200 rounded-lg">{error}</div>;
  }

  if (!game || !game.questions || game.questions.length === 0) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center p-10 bg-white rounded-lg shadow-md border">
                <h2 className="text-2xl font-bold mb-4 text-slate-700">Juego no disponible</h2>
                <p className="text-slate-500 mb-6">Este juego no se pudo cargar o no contiene preguntas.</p>
                <Button onClick={() => navigate('/user-games')} className="bg-slate-500 hover:bg-slate-600 text-white">
                    Volver a Mis Juegos
                </Button>
            </div>
        </div>
    );
  }

  const isGameFinished = currentQuestionIndex >= game.questions.length;
  const currentQuestion = game.questions[currentQuestionIndex];

  // Pantalla de Puntuación Final
  if (isGameFinished) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-2xl text-center border border-slate-200 fade-in">
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
      </div>
    );
  }

  // Pantalla de Juego
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl w-full fade-in">
        <div className="rounded-xl shadow-2xl overflow-hidden relative" style={{ backgroundColor: styles.containerBg, border: `1px solid ${styles.questionText}` }}>
          {/* Timer Circle */}
          <div className="timer-circle" style={{ backgroundColor: styles.timerBg, color: styles.timerTextColor }}>
            {countdown}
          </div>

          {/* Encabezado */}
          <div className="p-6" style={{ backgroundColor: styles.containerBg, color: styles.questionText }}>
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold truncate pr-4">{game.title}</h1>
              <div className="text-lg font-semibold flex-shrink-0">Puntuación: {score}</div>
            </div>
            {/* Progress bar removed */}
            <div className="text-right mt-1 text-sm" style={{ color: styles.answerTextColor }}>
              Pregunta {currentQuestionIndex + 1} de {game.questions.length}
            </div>
          </div>

          {/* Pregunta */}
          <div className="p-8">
            {currentQuestion.imageUrl && (
                <div className="mb-6 flex justify-center">
                    <img src={currentQuestion.imageUrl} alt="Pregunta" className="max-h-60 object-contain rounded-lg shadow-md" />
                </div>
            )}
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 min-h-[100px]" style={{ color: styles.questionText }}>
              {currentQuestion.question_text}
            </h2>

            {/* Respuestas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.questions[currentQuestionIndex].answers.map(answer => {
                const isSelected = selectedAnswer?.id === answer.id;
                let buttonClass = '';
                let buttonStyle = { borderRadius: `${styles.buttonRadius}px`, backgroundColor: styles.answerBg, color: styles.answerTextColor, border: `2px solid ${styles.answerTextColor}` };

                if (isAnswered) {
                  if (answer.is_correct) {
                    buttonClass = 'bg-emerald-500 border-emerald-500 text-white font-bold shadow-lg'; // Correcta
                    buttonStyle = { borderRadius: `${styles.buttonRadius}px` }; // Override with fixed color
                  } else if (isSelected) {
                    buttonClass = 'bg-red-500 border-red-500 text-white font-bold shadow-lg'; // Incorrecta seleccionada
                    buttonStyle = { borderRadius: `${styles.buttonRadius}px` }; // Override with fixed color
                  } else {
                    buttonClass = 'bg-slate-200 border-slate-200 text-slate-500 opacity-70'; // Otra incorrecta
                    buttonStyle = { borderRadius: `${styles.buttonRadius}px` }; // Override with fixed color
                  }
                } else {
                    // Default hover effect
                    buttonClass += ' hover:scale-105 hover:border-sky-400';
                }

                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswerSelect(answer)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 text-lg transition-all duration-300 transform ${buttonClass}`}
                    style={buttonStyle}
                  >
                    {answer.answer_text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlayerScreen;