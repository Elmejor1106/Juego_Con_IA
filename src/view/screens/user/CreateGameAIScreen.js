import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AIGameViewModel from '../../../viewModel/game/AIGameViewModel';
import VisualEditor from '../../components/game/VisualEditor';
import EditorToolbar from '../../components/game/EditorToolbar';
import AssetPalette from '../../components/game/AssetPalette';
import { GameProvider, useGame } from '../../../context/GameContext';

// --- Íconos SVG ---
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M19 3v4M17 5h4M14 11l-1.5-1.5L11 11l-1.5 1.5L11 14l1.5-1.5L14 11zM12 21l-1.5-1.5L9 21l-1.5 1.5L9 24l1.5-1.5L12 21zM3 19v-4M5 19H1M21 19v-4M19 19h4" /></svg>;
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


// --- Íconos para el nuevo panel lateral ---
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const TemplateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;


// --- Vista de Definición del Juego (Paso 1) ---
const DefineView = ({ onGenerate, isLoading }) => {
  const [topic, setTopic] = useState('El sistema solar');
  const [language, setLanguage] = useState('Español');
  const [count, setCount] = useState(10);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({ topic, language, count });
  };

  return (
    <div className="text-center text-slate-600 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800">Paso 1: Define tu Juego</h2>
      <p className="mt-2 text-lg">Describe el tema y la IA generará una lista de preguntas para que elijas.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <div>
          <label htmlFor="topic" className="block text-left text-sm font-medium text-slate-700">Tema Principal</label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="Ej: Historia de México"
            required
          />
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="language" className="block text-left text-sm font-medium text-slate-700">Idioma</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option>Español</option>
              <option>Inglés</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="count" className="block text-left text-sm font-medium text-slate-700">Nº de Preguntas</label>
            <input
              type="number"
              id="count"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10))}
              className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              min="5"
              max="20"
              required
            />
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300">
          {isLoading ? 'Generando...' : 'Generar Preguntas'}
          <SparklesIcon className="ml-2 h-5 w-5"/>
        </button>
      </form>
    </div>
  );
};

// --- Vista de Selección de Preguntas (Paso 2) ---
const SelectView = ({ questions, onConfirm, onCancel, isLoading }) => {
    const [selected, setSelected] = useState(new Set());

    const handleSelect = (index) => {
        const newSelection = new Set(selected);
        if (newSelection.has(index)) {
            newSelection.delete(index);
        } else {
            newSelection.add(index);
        }
        setSelected(newSelection);
    };

    const handleConfirm = () => {
        const selectedQuestions = questions.filter((_, index) => selected.has(index));
        onConfirm(selectedQuestions);
    };

    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col bg-slate-50 rounded-lg">
            <div className="max-w-4xl mx-auto w-full">
                <h2 className="text-3xl font-bold text-slate-800">Paso 2: Selecciona las Preguntas</h2>
                <p className="mt-1 text-lg text-slate-600">Elige las que quieres incluir en tu juego. ({selected.size} seleccionadas)</p>
            </div>
            <div className="flex-1 mt-6 overflow-y-auto space-y-4 max-w-4xl mx-auto w-full">
                {questions.map((q, index) => (
                    <div key={index} className={`p-4 rounded-lg cursor-pointer transition-all duration-150 ${selected.has(index) ? 'bg-sky-100 border-sky-500' : 'bg-white border-slate-200'} border-2 shadow-sm`} onClick={() => handleSelect(index)}>
                        <div className="flex items-start">
                            <input type="checkbox" className="h-5 w-5 rounded text-sky-600 focus:ring-sky-500 mt-1" checked={selected.has(index)} readOnly />
                            <div className="ml-4">
                                <p className="font-semibold text-slate-800">{q.question_text}</p>
                                <ul className="mt-2 text-sm space-y-1">
                                    {q.answers.map((ans, ansIndex) => (
                                        <li key={ansIndex} className={ans.is_correct ? 'text-green-600 font-bold' : 'text-slate-500'}>
                                            {ans.answer_text} {ans.is_correct && '(Correcta)'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="max-w-4xl mx-auto w-full mt-6 flex justify-between items-center">
                <button onClick={onCancel} className="px-6 py-2 bg-slate-300 text-slate-700 font-semibold rounded-lg shadow-md hover:bg-slate-400">
                    Volver
                </button>
                <button onClick={handleConfirm} disabled={isLoading || selected.size === 0} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed">
                    {isLoading ? 'Abriendo Editor...' : `Siguiente: Abrir Editor con ${selected.size} Preguntas`}
                </button>
            </div>
        </div>
    );
};

// --- Panel Lateral Fijo ---
const SidePanel = ({ view, onAddAsset, onNewGame }) => { // Añadir onNewGame
    const [activeTab, setActiveTab] = useState('materiales');

    const TabButton = ({ name, label, icon }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`flex-1 flex flex-col items-center p-3 text-xs font-medium transition-colors ${
                activeTab === name
                    ? 'bg-sky-100 text-sky-600'
                    : 'text-slate-500 hover:bg-slate-100'
            }`}
        >
            {icon}
            <span className="mt-1">{label}</span>
        </button>
    );

    const handleBackToGames = () => {
        // Ya no es necesario limpiar sessionStorage aquí, el GameContext lo maneja
    };

    return (
        <aside className="w-72 flex flex-col bg-white border-r border-slate-200 shadow-md">
            {/* Botón de Volver */}
            <div className="p-3 border-b border-slate-200">
                <Link to="/user-games" onClick={handleBackToGames} className="w-full flex items-center justify-center p-2 space-x-3 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors">
                    <BackIcon />
                    <span className="font-medium text-sm">Volver a Mis Juegos</span>
                </Link>
            </div>

            {/* Botón Nuevo Juego */}
            {view === 'editor' && (
                <div className="p-3 border-b border-slate-200">
                    <button onClick={onNewGame} className="w-full flex items-center justify-center p-2 space-x-3 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors">
                        <PlusCircleIcon />
                        <span className="font-medium text-sm">Nuevo Juego</span>
                    </button>
                </div>
            )}

            {/* Pestañas de Secciones */}
            <div className="flex border-b border-slate-200">
                <TabButton name="materiales" label="Materiales" icon={<ImageIcon />} />
                <TabButton name="subir" label="Subir" icon={<UploadIcon />} />
                <TabButton name="plantillas" label="Plantillas" icon={<TemplateIcon />} />
            </div>

            {/* Contenido de las Pestañas */}
            <div className="flex-1 p-4 overflow-y-auto">
                {activeTab === 'materiales' && (
                    view === 'editor'
                        ? <AssetPalette onAdd={onAddAsset} />
                        : <div className="text-center text-slate-500 p-4">
                            <ImageIcon className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-2 font-semibold text-slate-700">Materiales</h3>
                            <p className="text-sm mt-1">Los materiales y recursos visuales estarán disponibles aquí una vez que entres al editor.</p>
                          </div>
                )}
                {activeTab === 'subir' && (
                    <div className="text-center text-slate-500 p-4">
                        <UploadIcon className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-2 font-semibold text-slate-700">Subir Archivos</h3>
                        <p className="text-sm mt-1">Próximamente podrás subir tus propias imágenes y recursos para usar en el juego.</p>
                    </div>
                )}
                {activeTab === 'plantillas' && (
                    <div className="text-center text-slate-500 p-4">
                        <TemplateIcon className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-2 font-semibold text-slate-700">Plantillas</h3>
                        <p className="text-sm mt-1">En el futuro, aquí encontrarás plantillas de diseño predefinidas para acelerar tu creación.</p>
                    </div>
                )}
            </div>
        </aside>
    );
};


// --- Componente Principal ---
const CreateGameAIScreenContent = () => { // Renombrado para ser envuelto por GameProvider
  const navigate = useNavigate();
  const editorRef = useRef(null);
  
  const [view, setView] = useState('define'); // 'define', 'select', 'editor'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [gameDefinition, setGameDefinition] = useState(null); // Se mantiene para el paso 1 y 2
  const [candidateQuestions, setCandidateQuestions] = useState([]); // Se mantiene para el paso 2
  
  const [isSaving, setIsSaving] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [slideElements, setSlideElements] = useState(null); // Estado local para el canvas

  const {
    currentGame,
    currentSlideIndex,
    setCurrentSlideIndex,
    initializeNewGame,
    updateSlide,
    addElementToCurrentSlide,
    updateElementInCurrentSlide,
    removeElementFromCurrentSlide,
    clearGameDraft,
  } = useGame();

    const slideStatesRef = useRef({}); // Guarda los objetos por slideIndex
    const fabricCanvasRef = useRef(null);

  // Efecto para sincronizar el estado local del canvas con el del GameContext
  useEffect(() => {
    if (currentGame && currentGame.slides && currentGame.slides[currentSlideIndex]) {
      setSlideElements(currentGame.slides[currentSlideIndex].elements || []);
    } else {
      setSlideElements(null);
    }
  }, [currentSlideIndex, currentGame]);

  // Efecto para manejar la carga inicial y la persistencia del estado
  useEffect(() => {
    if (currentGame && currentGame.slides && currentGame.slides.length > 0) {
      setView('editor');
    } else {
      // Si no hay juego cargado o está vacío, asegurar que la vista sea 'define'
      setView('define');
      setGameDefinition(null);
      setCandidateQuestions([]);
    }
  }, [currentGame]); // Dependencia de currentGame

  // Limpiar el borrador al salir de la pantalla o al iniciar un nuevo juego
  const handleNewGame = useCallback(() => {
    clearGameDraft();
    setView('define');
    setGameDefinition(null);
    setCandidateQuestions([]);
    navigate('/create-game-ai'); // Redirigir a la misma ruta para forzar un remount si es necesario
  }, [clearGameDraft, navigate]);

  const handleGenerateCandidates = async (definition) => {
    setIsLoading(true);
    setError(null);
    setGameDefinition(definition); // Guardar la definición para usarla en handleEnterEditor
    
    const result = await AIGameViewModel.generateQuestions(definition);

    if (result && result.questions) {
      setCandidateQuestions(result.questions);
      setView('select');
    } else {
      setError(result.error || 'No se pudieron generar las preguntas.');
    }
    setIsLoading(false);
  };

  const handleEnterEditor = (selectedQuestions) => {
      if (!gameDefinition || selectedQuestions.length === 0) {
          setError('No se seleccionaron preguntas.');
          return;
      }
      // Inicializar el juego en el contexto global
      initializeNewGame(
          `Juego sobre ${gameDefinition.topic}`,
          `Un juego en ${gameDefinition.language} con ${selectedQuestions.length} preguntas.`,
          selectedQuestions
      );
      setView('editor');
  };

  const handleSaveGame = async () => {
    if (!currentGame || !currentGame.slides || currentGame.slides.length === 0) {
      alert('No hay juego para guardar.');
      return;
    }

    setIsSaving(true);

    // 1. Usar el estado local del canvas que es el más actualizado.
    const currentCanvasState = slideElements;

    // 2. Crear una copia actualizada de las diapositivas para asegurar consistencia.
    const updatedSlides = currentGame.slides.map((slide, index) => {
        if (index === currentSlideIndex) {
            return { ...slide, elements: currentCanvasState };
        }
        return slide;
    });

    // 3. Construir el objeto a guardar con los datos actualizados y consistentes.
    const gameToSave = {
        ...currentGame,
        slides: updatedSlides, // Usar las diapositivas actualizadas
        game_state: JSON.stringify({ 
            slides: updatedSlides,
        }),
    };
    
    // 4. Llamar al ViewModel y manejar el resultado.
    const result = await AIGameViewModel.saveGame(gameToSave);
    if (result.success) {
      alert('¡Juego guardado con éxito!');
      clearGameDraft(); // Limpiar el borrador de localStorage.
      navigate('/user-games');
    } else {
      alert(`Error al guardar el juego: ${result.message}`);
    }
    setIsSaving(false);
  };

  const handleAddAsset = (assetType, assetData) => {
    // El VisualEditor debería manejar la adición y luego notificar al contexto
    // Por ahora, llamamos directamente a addElementToCurrentSlide
    addElementToCurrentSlide({ type: assetType, ...assetData });
  };

  const handleToolbarAction = (action, value) => {
    if (editorRef.current) {
      // El VisualEditor debe tener una forma de aplicar estilos y notificar al contexto
      // Esto es un placeholder, la implementación real dependerá de VisualEditor
      editorRef.current.applyStyle(action, value);
      // Después de aplicar el estilo, el VisualEditor debería llamar a updateElementInCurrentSlide
      // con el elemento modificado.
    }
  };

  const handleObjectSelected = (object) => {
    setSelectedObject(object);
  };


  const handleSlideChange = (newIndex) => {
  if (!editorRef.current) {
    setCurrentSlideIndex(newIndex);
    return;
  }

  // Guardar estado del slide actual (usando método del editor)
  try {
    const currentState = editorRef.current.getCanvasState() || [];
    slideStatesRef.current[currentSlideIndex] = currentState;
  } catch (e) {
    console.warn('No se pudo obtener estado actual del canvas:', e);
  }

  // Cambiar índice (dispara re-render y actualización de props)
  setCurrentSlideIndex(newIndex);

  // Restaurar slide nuevo (si teníamos estado guardado)
  const savedState = slideStatesRef.current[newIndex];
  if (savedState && savedState.length > 0) {
    // Restaurar con la API del editor
    editorRef.current.restoreCanvasState(savedState);
  } else {
    // No hay estado guardado: limpiar el canvas y dejar que el VisualEditor
    // re-renderice usando slideData prop (o renderFromSlideData si expusieras uno).
    editorRef.current.restoreCanvasState([]);
  }
};




  const getCurrentSlideData = () => {
    if (!currentGame || !currentGame.slides || currentGame.slides.length === 0) return null;
    
    const currentSlideData = currentGame.slides[currentSlideIndex];
    return {
        type: 'question',
        question: currentSlideData.question,
        questionIndex: currentSlideIndex,
    };
  };

  const renderInitialContent = () => {
    if (isLoading && view === 'define') {
        return (
            <div className="flex flex-col items-center text-slate-500">
                <SparklesIcon className="h-16 w-16 animate-pulse" />
                <p className="mt-4 text-lg font-semibold">Generando preguntas...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center text-red-500">
                <h2 className="text-2xl font-semibold">Ocurrió un Error</h2>
                <p className="mt-2">{error}</p>
                <button onClick={() => { setError(null); setView('define'); }} className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-md">
                    Intentar de Nuevo
                </button>
            </div>
        );
    }

    switch (view) {
      case 'select':
        return <SelectView questions={candidateQuestions} onConfirm={handleEnterEditor} onCancel={() => setView('define')} isLoading={isLoading} />;
      case 'editor':
        // Si estamos en el editor pero no hay juego cargado (ej. borrador corrupto), volver a definir
        if (!currentGame || !currentGame.slides || currentGame.slides.length === 0 || slideElements === null) {
            return <DefineView onGenerate={handleGenerateCandidates} isLoading={isLoading} />;
        }
        // Renderizar el editor si hay un juego
        const totalSlides = currentGame.slides.length;
        return (
            <div className="flex-1 flex h-full border border-slate-200 rounded-xl shadow-md bg-white overflow-hidden">
                <div className="flex-1 flex flex-col h-full">
                    <EditorToolbar 
                        onAction={handleToolbarAction} 
                        selectedObject={selectedObject} 
                        onSave={handleSaveGame} 
                        isSaving={isSaving} 
                        onDelete={removeElementFromCurrentSlide} // Asumiendo que EditorToolbar tiene un botón de borrar
                    />
                    <div className="flex-1 h-full bg-slate-200 relative">
                        <VisualEditor
                            key={currentSlideIndex} // Usar currentSlideIndex como key para forzar remount si es necesario
                            ref={editorRef}
  slideData={getCurrentSlideData()}
  initialCanvasState={slideElements}
                            onObjectSelected={handleObjectSelected} 
                            onCanvasChange={(elements) => {
                                setSlideElements(elements); // Actualizar estado local para feedback inmediato
                                updateSlide(currentGame.slides[currentSlideIndex].id, elements); // Actualizar contexto
                            }} // Guardar cambios del canvas
                            onUpdateElement={updateElementInCurrentSlide} // Para que VisualEditor notifique cambios a elementos
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4 pointer-events-none">
                            <button 
                                onClick={() => handleSlideChange(currentSlideIndex - 1)} 
                                disabled={currentSlideIndex === 0}
                                className="pointer-events-auto bg-white/50 hover:bg-white rounded-full p-2 shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ArrowLeftIcon />
                            </button>
                            <button 
                                onClick={() => handleSlideChange(currentSlideIndex + 1)} 
                                disabled={currentSlideIndex >= totalSlides - 1}
                                className="pointer-events-auto bg-white/50 hover:bg-white rounded-full p-2 shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ArrowRightIcon />
                            </button>
                        </div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/70 text-white text-sm px-3 py-1 rounded-full">
                            Diapositiva {currentSlideIndex + 1} de {totalSlides}
                        </div>
                    </div>
                </div>
            </div>
        );
      case 'define':
      default:
        return <DefineView onGenerate={handleGenerateCandidates} isLoading={isLoading} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <SidePanel view={view} onAddAsset={handleAddAsset} onNewGame={handleNewGame} />

      <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        {renderInitialContent()}
      </main>
    </div>
  );
};

const CreateGameAIScreen = () => (
  <GameProvider>
    <CreateGameAIScreenContent />
  </GameProvider>
);

export default CreateGameAIScreen;
