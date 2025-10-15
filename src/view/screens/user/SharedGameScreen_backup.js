import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, User, ArrowLeft, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Button from '../../components/common/Button';

const DEFAULT_LAYOUT = {
  question: { x: 40, y: 140 },
  image: { x: 225, y: 20 },
  answers: { x: 40, y: 250 },
  timer: { x: 650, y: 20 },
};

const SharedGameScreen = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [styles, setStyles] = useState({
    containerBg: '#ffffff',
    containerBgImage: '',
    questionText: '#1f2937',
    answerBg: '#f3f4f6',
    answerTextColor: '#1f2937',
    buttonRadius: 12,
    timerBg: '#EF4444',
    timerTextColor: '#FFFFFF',
  });
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

const SharedGameScreen = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSharedGame();
  }, [token]);

  const loadSharedGame = async () => {
    setLoading(true);
    setError('');

    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        // Redirigir al login si no está autenticado
        navigate(`/auth?returnUrl=/shared/${token}`);
        return;
      }

      const response = await fetch(`http://localhost:5003/api/games/shared/${token}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Error al acceder al juego compartido');
      }

      const data = await response.json();
      
      // Cargar estilos del juego
      let loadedStyles = {};
      if (data.game.styles) {
        try {
          loadedStyles = typeof data.game.styles === 'string' ? JSON.parse(data.game.styles) : data.game.styles;
        } catch (e) { 
          console.error("Failed to parse styles JSON:", e); 
        }
      }
      setStyles(prevStyles => ({ ...prevStyles, ...loadedStyles }));

      // Cargar layout del juego
      let loadedLayout = {};
      if (data.game.layout) {
        try {
          loadedLayout = typeof data.game.layout === 'string' ? JSON.parse(data.game.layout) : data.game.layout;
        } catch(e) { 
          console.error("Failed to parse layout JSON:", e); 
        }
      }
      setLayout(loadedLayout && Object.keys(loadedLayout).length > 0 ? loadedLayout : DEFAULT_LAYOUT);

      setGameData(data);

    } catch (err) {
      console.error('Error cargando juego compartido:', err);
      setError(err.message || 'Error al cargar el juego compartido');
    } finally {
      setLoading(false);
    }
  };

  const goToNext = () => {
    if (gameData?.game?.questions && currentQuestionIndex < gameData.game.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando juego compartido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-500 mb-4">
            <Share2 size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Enlace no válido</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  if (!gameData?.game?.questions || gameData.game.questions.length === 0) {
    return (
      <div className="w-screen h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Este juego no tiene preguntas disponibles.</p>
          <Button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white mt-4"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const { game, shareInfo } = gameData;
  const currentQuestion = game.questions[currentQuestionIndex];
  const totalQuestions = game.questions.length;

  return (
    <div className="w-screen h-screen bg-gray-100 p-0 m-0" style={{ 
      backgroundColor: styles.containerBg, 
      backgroundImage: styles.containerBgImage ? `url(${styles.containerBgImage})` : 'none', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center' 
    }}>
      {/* Contenedor principal del juego - pantalla completa */}
      <div className="w-full h-full relative" style={{ 
        minHeight: '100vh', 
        backgroundColor: styles.containerBg, 
        backgroundImage: styles.containerBgImage ? `url(${styles.containerBgImage})` : 'none', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }}>
        
        {/* Timer/Contador de preguntas en la esquina superior derecha */}
        <div className="absolute top-6 right-6 z-10">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-lg font-bold shadow-lg" style={{ 
            backgroundColor: styles.timerBg, 
            color: styles.timerTextColor 
          }}>
            {currentQuestionIndex + 1}
          </div>
        </div>

        {/* Botón de cerrar en la esquina superior izquierda */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-full bg-gray-800 bg-opacity-50 text-white flex items-center justify-center hover:bg-opacity-70 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contador de preguntas centrado arriba */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white bg-opacity-90 px-4 py-2 rounded-full shadow-lg">
            <span className="text-sm font-medium text-gray-800">
              Pregunta {currentQuestionIndex + 1} de {totalQuestions}
            </span>
          </div>
        </div>

        {/* Información del propietario */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-blue-50 bg-opacity-95 px-3 py-1 rounded-full shadow">
            <span className="text-xs text-blue-700">
              Compartido por {shareInfo.ownerName}
            </span>
          </div>
        </div>

        {/* Pregunta */}
        <div className="pt-32 pb-8 px-8 text-center">
          <h2 className="text-4xl font-bold" style={{ color: styles.questionText }}>
            {currentQuestion.question_text || currentQuestion.question}
          </h2>
        </div>

        {/* Imagen - Universal o específica */}
        <div className="flex justify-center mb-8">
          <div style={{ width: '1000px', height: '490px', background: 'transparent', overflow: 'hidden', border: 'none', padding: '0' }}>
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={currentQuestion.imageUrl ? 
                  `http://localhost:5003${currentQuestion.imageUrl}` : 
                  '/images/universal-question.svg'
                } 
                alt="Pregunta" 
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  background: 'transparent'
                }}
                onError={(e) => {
                  // Fallback para imagen por defecto
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
            {(currentQuestion.answers || currentQuestion.options || []).map((answer, index) => {
              const answerText = answer.answer_text || answer.text || answer;
              
              return (
                <div
                  key={index}
                  className="w-full text-left transition-all duration-300 shadow-lg flex items-center cursor-default"
                  style={{ 
                    borderRadius: `${styles.buttonRadius}px`, 
                    backgroundColor: styles.answerBg, 
                    color: styles.answerTextColor, 
                    border: '2px solid transparent',
                    padding: '30px 40px',
                    fontSize: '20px',
                    fontWeight: '500',
                    minHeight: '80px',
                    width: '100%'
                  }}
                >
                  {answerText}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navegación */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={goToPrevious}
            disabled={currentQuestionIndex === 0}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          
          <div className="bg-white px-4 py-2 rounded-full shadow-lg">
            <span className="text-sm font-medium text-gray-800">
              {currentQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>
          
          <button
            onClick={goToNext}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={24} className="text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedGameScreen;