import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Para generar IDs únicos

const GameContext = createContext();

export const useGame = () => {
  return useContext(GameContext);
};

export const GameProvider = ({ children }) => {
  const [currentGame, setCurrentGame] = useState(null); // El documento JSON completo del juego
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // Índice de la diapositiva activa

  // Cargar el borrador del juego desde localStorage al inicio
  useEffect(() => {
    console.log("GameContext: Loading from localStorage (runs once)");
    const storedGame = localStorage.getItem('currentGameDraft');
    if (storedGame) {
      try {
        const parsedGame = JSON.parse(storedGame);
        setCurrentGame(parsedGame);
        // Intentar restaurar el slide index si existe y es válido
        if (parsedGame.currentSlideIndex !== undefined && parsedGame.currentSlideIndex < parsedGame.slides.length) {
          setCurrentSlideIndex(parsedGame.currentSlideIndex);
        } else {
          setCurrentSlideIndex(0);
        }
      } catch (e) {
        console.error("Error parsing stored game draft:", e);
        localStorage.removeItem('currentGameDraft'); // Limpiar si está corrupto
      }
    }
  }, []);

  // Guardar el juego actual en localStorage cada vez que cambie
  useEffect(() => {
  if (!currentGame) {
    localStorage.removeItem("currentGameDraft");
    return;
  }

  const handler = setTimeout(() => {
    const dataToSave = { ...currentGame, currentSlideIndex };
    const prevData = localStorage.getItem("currentGameDraft");

    if (prevData !== JSON.stringify(dataToSave)) {
      console.log("GameContext: Saving to localStorage...");
      localStorage.setItem("currentGameDraft", JSON.stringify(dataToSave));
    } else {
      console.log("GameContext: No changes, skipping save");
    }
  }, 300); // guarda solo si pasaron 300ms sin más cambios

  return () => clearTimeout(handler);
}, [currentGame, currentSlideIndex]);



  // Inicializar un nuevo juego
  const initializeNewGame = useCallback((title, description, questions) => {
    console.log('[GameContext] ==> Initializing new game with', questions.length, 'questions.');
    const newGameId = uuidv4();
    const initialSlides = questions.map(q => ({
      id: uuidv4(),
      question: q, // La pregunta completa con sus respuestas
      elements: [], // Elementos visuales para esta diapositiva
    }));

    const newGame = {
      id: newGameId,
      title: title,
      description: description,
      slides: initialSlides,
      is_public: false, // Valor por defecto, se puede cambiar en el editor
      game_type: 'ai', // Siempre 'ai' para este flujo
    };
    console.log('[GameContext] ==> New game object created:', newGame);
    setCurrentGame(newGame);
    setCurrentSlideIndex(0); // Siempre empezar en la primera diapositiva
  }, []);

  // Actualizar una diapositiva específica (ej. añadir/modificar elementos)
  const updateSlide = useCallback((slideId, newElements) => {
    console.log(`[GameContext] ==> Updating slide ${slideId} with`, newElements.length, 'elements.');
    setCurrentGame(prevGame => {
      if (!prevGame) {
        console.warn('[GameContext] updateSlide called but there is no previous game.');
        return null;
      }

      const updatedSlides = prevGame.slides.map(slide => {
        if (slide.id === slideId) {
          return { ...slide, elements: newElements };
        }
        return slide;
      });
      
      const newGame = { ...prevGame, slides: updatedSlides };
      console.log('[GameContext] ==> Slide updated. New game state:', newGame);
      return newGame;
    });
  }, []);

  // Añadir un elemento a la diapositiva actual
  const addElementToCurrentSlide = useCallback((element) => {
    setCurrentGame(prevGame => {
      if (!prevGame || !prevGame.slides || prevGame.slides.length === 0) return prevGame;
      const updatedSlides = prevGame.slides.map((slide, index) => {
        if (index === currentSlideIndex) {
          return { ...slide, elements: [...slide.elements, { id: uuidv4(), ...element }] };
        }
        return slide;
      });
      return { ...prevGame, slides: updatedSlides };
    });
  }, [currentSlideIndex]);

  // Actualizar un elemento específico en la diapositiva actual
  const updateElementInCurrentSlide = useCallback((elementId, updates) => {
    setCurrentGame(prevGame => {
      if (!prevGame || !prevGame.slides || prevGame.slides.length === 0) return prevGame;
      const updatedSlides = prevGame.slides.map((slide, index) => {
        if (index === currentSlideIndex) {
          const updatedElements = slide.elements.map(el =>
            el.id === elementId ? { ...el, ...updates } : el
          );
          return { ...slide, elements: updatedElements };
        }
        return slide;
      });
      return { ...prevGame, slides: updatedSlides };
    });
  }, [currentSlideIndex]);

  // Eliminar un elemento de la diapositiva actual
  const removeElementFromCurrentSlide = useCallback((elementId) => {
    setCurrentGame(prevGame => {
      if (!prevGame || !prevGame.slides || !prevGame.slides.length === 0) return prevGame;
      const updatedSlides = prevGame.slides.map((slide, index) => {
        if (index === currentSlideIndex) {
          const filteredElements = slide.elements.filter(el => el.id !== elementId);
          return { ...slide, elements: filteredElements };
        }
        return slide;
      });
      return { ...prevGame, slides: updatedSlides };
    });
  }, [currentSlideIndex]);

  // Limpiar el juego actual y el localStorage
  const clearGameDraft = useCallback(() => {
    setCurrentGame(null);
    setCurrentSlideIndex(0);
    localStorage.removeItem('currentGameDraft');
  }, []);

  const value = {
    currentGame,
    currentSlideIndex,
    setCurrentSlideIndex,
    initializeNewGame,
    updateSlide,
    addElementToCurrentSlide,
    updateElementInCurrentSlide,
    removeElementFromCurrentSlide,
    clearGameDraft,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
