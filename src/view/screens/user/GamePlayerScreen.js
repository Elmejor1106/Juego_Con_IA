import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import GameService from '../../../model/business_logic/services/GameService';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../components/common/Button';
import './GamePlayerScreen.css';
import '../user/CreateGameAIScreen.css';

const backendUrl = 'http://localhost:5000';

const DEFAULT_LAYOUT = {
  question: { x: 40, y: 140 },
  image: { x: 225, y: 20 },
  answers: { x: 40, y: 250 },
  timer: { x: 650, y: 20 },
};

const GamePlayerScreen = () => {
  const { gameId } = useParams(); // Solo gameId - esta pantalla es SOLO para juegos individuales
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // LOGS INMEDIATOS AL CARGAR
  console.log('🎮 [GamePlayerScreen] === COMPONENTE RENDERIZADO (SOLO INDIVIDUAL) ===');
  console.log('🎮 [GamePlayerScreen] GameId:', gameId);
  console.log('🎮 [GamePlayerScreen] User:', user?.username || 'NO AUTENTICADO');

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [nextQuestionCountdown, setNextQuestionCountdown] = useState(0);
  
  // Estados para el ranking temporal (solo en memoria)
  const [gameFinished, setGameFinished] = useState(false);
  const [sessionScores, setSessionScores] = useState([]);
  
  const [styles, setStyles] = useState({
    containerBg: '#ffffff',
    containerBgImage: '',
    questionText: '#1f2937',
    answerBg: '#f3f4f6',
    answerTextColor: '#1f2937',
    buttonRadius: 8,
    timerBg: '#EF4444',
    timerTextColor: '#FFFFFF',
  });
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);

  const handleNextQuestion = useCallback(() => {
    console.log('⏭️ [GamePlayerScreen] handleNextQuestion llamado');
    
    // Protección adicional
    if (!game || !game.questions || game.questions.length === 0) {
      console.log('❌ [GamePlayerScreen] No hay juego o preguntas disponibles');
      return;
    }
    
    if (currentQuestionIndex < game.questions.length - 1) {
        console.log('▶️ [GamePlayerScreen] Avanzando a siguiente pregunta');
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setCountdown(60);
        setTimerActive(true);
        setIsAnswered(false);
        setSelectedAnswer(null);
    } else {
        console.log('🏁 [GamePlayerScreen] Juego terminado');
        setTimerActive(false);
        // Al finalizar el juego, marcar como terminado
        setGameFinished(true);
        // Agregar la puntuación actual a la sesión
        const currentScore = {
          id: Date.now(),
          username: user?.username || 'Jugador Anónimo',
          score: score,
          totalQuestions: game.questions.length,
          percentage: Math.round((score / game.questions.length) * 100),
          timestamp: new Date()
        };
        setSessionScores(prev => [currentScore, ...prev].slice(0, 10)); // Solo mantener los 10 mejores
    }
  }, [currentQuestionIndex, game, score, user]);

  useEffect(() => {
    const fetchGame = async () => {
      console.log('🎮 [GamePlayerScreen] === INICIANDO CARGA DE JUEGO INDIVIDUAL ===');
      console.log('🎮 [GamePlayerScreen] GameId:', gameId);
      console.log('🎮 [GamePlayerScreen] User:', user?.username || 'NO AUTENTICADO');
      
      setLoading(true);
      setError('');
      try {
        console.log('🎮 [GamePlayerScreen] Cargando juego individual...');
        const result = await GameViewModel.getGameById(gameId);
        
        console.log('📊 [GamePlayerScreen] Resultado:', result);
        
        if (result.success) {
          const fetchedGame = result.game;
          console.log('✅ [GamePlayerScreen] Juego cargado exitosamente:', fetchedGame.title);
          console.log('📝 [GamePlayerScreen] Preguntas encontradas:', fetchedGame.questions?.length || 0);

          let loadedStyles = {};
          if (fetchedGame.styles) {
            try {
              loadedStyles = typeof fetchedGame.styles === 'string' ? JSON.parse(fetchedGame.styles) : fetchedGame.styles;
            } catch (e) { console.error("Failed to parse styles JSON:", e); }
          }
          setStyles(prevStyles => ({ ...prevStyles, ...loadedStyles }));

          let loadedLayout = {};
          if (fetchedGame.layout) {
            try {
                loadedLayout = typeof fetchedGame.layout === 'string' ? JSON.parse(fetchedGame.layout) : fetchedGame.layout;
            } catch(e) { console.error("Failed to parse layout JSON:", e); }
          }
          setLayout(loadedLayout && Object.keys(loadedLayout).length > 0 ? loadedLayout : DEFAULT_LAYOUT);

          setGame(fetchedGame);
          setTimerActive(true);
        } else {
          console.log('❌ [GamePlayerScreen] Error al cargar juego:', result.error);
          setError(result.error || 'No se pudo cargar el juego.');
        }
      } catch (err) {
        console.error('💥 [GamePlayerScreen] Error crítico:', err);
        setError(err.message || 'Ocurrió un error al buscar el juego.');
      } finally {
        setLoading(false);
        console.log('🏁 [GamePlayerScreen] === CARGA DE JUEGO FINALIZADA ===');
      }
    };

    fetchGame();
  }, [gameId]);

  useEffect(() => {
    // Registrar gameplay si el usuario está autenticado
    if (user) {
      console.log('📊 [GamePlayerScreen] Registrando gameplay para usuario autenticado');
      GameService.logGamePlay(gameId);
    } else {
      console.log('🔄 [GamePlayerScreen] Skipping gameplay log (usuario no autenticado)');
    }
  }, [gameId, user]);

  // compute scale to make design (750x420) fill the available screen while preserving aspect ratio
  useEffect(() => {
    const computeScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const designW = 750;
      const designH = 420;
      const scaleW = vw / designW;
      const scaleH = vh / designH;
      const newScale = Math.min(scaleW, scaleH);
      setScale(newScale);
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

  useEffect(() => {
    if (timerActive && countdown > 0) {
        const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    } else if (countdown === 0) {
        handleNextQuestion();
    }
  }, [countdown, timerActive, handleNextQuestion]);

  const handleAnswerSelect = (answer) => {
    if (isAnswered) return;
    setTimerActive(false);
    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (answer.is_correct) {
      setScore(prevScore => prevScore + 1);
    }
    
    // Iniciar countdown visual de 2 segundos
    setNextQuestionCountdown(2);
    const countdownInterval = setInterval(() => {
      setNextQuestionCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRestartGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCountdown(60);
    setTimerActive(true);
    setGameFinished(false);
    setNextQuestionCountdown(0);
  };

  if (loading || !layout) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-slate-500">Cargando juego...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-600 p-4">{error}</div>;
  }

  if (!game || !game.questions || game.questions.length === 0) {
    console.log('⚠️ [GamePlayerScreen] Juego no válido:', { 
      game: !!game, 
      questions: game?.questions?.length || 0,
      gameObj: game 
    });
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center p-10 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-slate-700">Juego no disponible</h2>
                <p className="text-slate-500 mb-6">Este juego no se pudo cargar o no contiene preguntas.</p>
                <Button 
                  onClick={() => navigate('/user-games')} 
                  className="bg-slate-500 hover:bg-slate-600"
                >
                  Volver a Mis Juegos
                </Button>
            </div>
        </div>
    );
  }

  // Proteger acceso a game.questions
  const safeQuestions = game.questions || [];
  const isGameFinished = gameFinished || currentQuestionIndex >= safeQuestions.length;
  const currentQuestion = !isGameFinished && safeQuestions.length > 0 ? safeQuestions[currentQuestionIndex] : null;

  console.log('🎯 [GamePlayerScreen] Estado del juego:', {
    isGameFinished,
    currentQuestionIndex,
    totalQuestions: safeQuestions.length,
    currentQuestion: currentQuestion?.question || 'N/A'
  });

  if (isGameFinished) {
    const percentage = Math.round((score / safeQuestions.length) * 100);
    
    return (
      <div className="flex items-center justify-center min-h-screen p-4" style={{ backgroundColor: styles.containerBg }}>
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header de resultados */}
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-4">¡Juego Terminado!</h1>
            <div className="flex justify-center items-center space-x-8 mb-4">
              <div className="text-center">
                <p className="text-lg opacity-90">Tu Puntuación</p>
                <p className="text-5xl font-bold">{score}</p>
                <p className="text-xl opacity-90">de {game.questions.length}</p>
              </div>
              <div className="text-center">
                <p className="text-lg opacity-90">Porcentaje</p>
                <p className="text-4xl font-bold">{percentage}%</p>
              </div>
            </div>
            <p className="text-lg opacity-90">
              {user ? `¡Bien hecho, ${user.username}!` : '¡Bien hecho!'}
            </p>
          </div>

          {/* Mensaje de rendimiento */}
          <div className="p-8 text-center">
            <div className="mb-6">
              {percentage >= 90 ? (
                <div className="text-green-600">
                  <div className="text-6xl mb-2">🏆</div>
                  <h2 className="text-2xl font-bold">¡Excelente!</h2>
                  <p className="text-lg">Puntuación perfecta</p>
                </div>
              ) : percentage >= 70 ? (
                <div className="text-blue-600">
                  <div className="text-6xl mb-2">🎉</div>
                  <h2 className="text-2xl font-bold">¡Muy Bien!</h2>
                  <p className="text-lg">Buen desempeño</p>
                </div>
              ) : percentage >= 50 ? (
                <div className="text-yellow-600">
                  <div className="text-6xl mb-2">👍</div>
                  <h2 className="text-2xl font-bold">¡Bien!</h2>
                  <p className="text-lg">Puedes mejorar</p>
                </div>
              ) : (
                <div className="text-red-600">
                  <div className="text-6xl mb-2">💪</div>
                  <h2 className="text-2xl font-bold">¡Sigue Practicando!</h2>
                  <p className="text-lg">La práctica hace al maestro</p>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-center space-x-4 mt-8">
              <Button 
                onClick={handleRestartGame} 
                className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 text-lg font-semibold"
              >
                🎮 Jugar de Nuevo
              </Button>
              <Button 
                onClick={() => navigate('/user-games')} 
                className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 text-lg font-semibold"
              >
                📝 Ver Otros Juegos
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-gray-100 p-0 m-0" style={{ backgroundColor: styles.containerBg, backgroundImage: styles.containerBgImage ? `url(${styles.containerBgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Contenedor principal del juego - pantalla completa */}
      <div className="w-full h-full relative" style={{ minHeight: '100vh', backgroundColor: styles.containerBg, backgroundImage: styles.containerBgImage ? `url(${styles.containerBgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Timer */}
        <div className="absolute top-6 right-6 z-10">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg" style={{ backgroundColor: styles.timerBg, color: styles.timerTextColor }}>
            {countdown}
          </div>
        </div>

        {/* Pregunta */}
        <div className="pt-20 pb-8 px-8 text-center">
          <h2 className="text-4xl font-bold" style={{ color: styles.questionText }}>
            {currentQuestion.question_text}
          </h2>
        </div>

        {/* Imagen - Universal o específica */}
        <div className="flex justify-center mb-8">
          <div className="question-image-dropzone" style={{ width: '1000px', height: '490px', background: 'transparent', overflow: 'hidden', border: 'none', padding: '0' }}>
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={currentQuestion.imageUrl ? 
                  `${backendUrl}${currentQuestion.imageUrl}` : 
                  '/images/universal-question.svg'
                } 
                alt="Pregunta" 
                className="question-image-preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  background: 'transparent'
                }}
                onError={(e) => {
                  console.log('❌ [GamePlayerScreen] Error cargando imagen:', e.target.src);
                  // Fallback: mostrar una imagen de data URL como último recurso
                  e.target.src = 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 490" width="1000" height="490">
                      <rect width="1000" height="490" fill="#ffffff" stroke="#3b82f6" stroke-width="4" rx="12"/>
                      <circle cx="500" cy="245" r="60" fill="#3b82f6"/>
                      <text x="500" y="265" text-anchor="middle" font-size="80" fill="white" font-family="Arial">?</text>
                      <text x="500" y="350" text-anchor="middle" font-size="24" fill="#3b82f6" font-family="Arial">Pregunta de Quiz</text>
                    </svg>
                  `);
                }}
              />
            </div>
          </div>
        </div>

        {/* Respuestas */}
        <div className="px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-full mx-auto">
            {currentQuestion.answers.map(answer => {
              const isSelected = selectedAnswer?.id === answer.id;
              let buttonStyle = { 
                borderRadius: `${styles.buttonRadius}px`, 
                backgroundColor: styles.answerBg, 
                color: styles.answerTextColor, 
                border: '2px solid transparent',
                padding: '30px 40px',
                fontSize: '20px',
                fontWeight: '500',
                minHeight: '80px',
                width: '100%'
              };

              if (isAnswered) {
                if (answer.is_correct) buttonStyle = { ...buttonStyle, backgroundColor: '#22c55e', color: 'white', borderColor: '#16a34a' };
                else if (isSelected) buttonStyle = { ...buttonStyle, backgroundColor: '#ef4444', color: 'white', borderColor: '#dc2626' };
                else buttonStyle = { ...buttonStyle, opacity: 0.6 };
              }

              return (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer)}
                  disabled={isAnswered}
                  className="w-full text-left transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
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
  );
};

export default GamePlayerScreen;
