import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../model/data/api/apiClient';
import { ArrowLeft, Share2, Bot, Loader, Wand2, Palette, ChevronLeft, ChevronRight, UploadCloud, Image as ImageIcon, X, CheckCircle2, Cloud } from 'lucide-react';
import AIGameViewModel from '../../../viewModel/game/AIGameViewModel';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import ImageService from '../../../model/business_logic/services/ImageService';
import SuccessModal from '../../components/common/SuccessModal';
import './CreateGameAIScreen.css'; // Reusing the same CSS

// --- Helper Components (copied from CreateGameAIScreen) ---

const AutoSaveIndicator = ({ isSaving }) => {
    const [showSaved, setShowSaved] = useState(false);
    const prevIsSaving = useRef(false);

    useEffect(() => {
        if (prevIsSaving.current && !isSaving) {
            setShowSaved(true);
            const timer = setTimeout(() => {
                setShowSaved(false);
            }, 2000); // Show for 2 seconds
            return () => clearTimeout(timer);
        }
        prevIsSaving.current = isSaving;
    }, [isSaving]);

    if (isSaving) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader size={16} className="animate-spin" />
                <span>Guardando...</span>
            </div>
        );
    }

    if (showSaved) {
        return (
            <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 size={16} />
                <span>Guardado</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-sm text-gray-400">
            <Cloud size={16} />
            <span>Guardado en la nube</span>
        </div>
    );
};

const GameStateSelector = ({ isPublic, onStateChange }) => {
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Estado:</span>
            <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isPublic} onChange={(e) => onStateChange(e.target.checked)} className="sr-only peer" />
                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-800 w-16 text-left">{isPublic ? 'Público' : 'Privado'}</span>
        </div>
    );
};

const SidebarButton = ({ icon, isActive, onClick }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}>
      {icon}
    </button>
  );

const NewSidebar = ({ onImagesLoaded }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [activeSection, setActiveSection] = useState(null);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  
    const handleDragStart = (e, imageUrl) => {
      e.dataTransfer.setData('text/plain', imageUrl);
    };
  
    const fetchUserImages = useCallback(async () => {
      try {
        const images = await ImageService.getMyImages();
        setUploadedImages(images);
        if (onImagesLoaded) {
          onImagesLoaded(images.map(img => img.image_url));
        }
      } catch (error) {
        console.error("Failed to fetch user images:", error);
      }
    }, [onImagesLoaded]);
  
    useEffect(() => {
      fetchUserImages();
    }, [fetchUserImages]);
  
    const handleSectionClick = (section) => {
      if (activeSection === section && isPanelOpen) {
        setIsPanelOpen(false);
        setActiveSection(null);
      } else {
        setActiveSection(section);
        setIsPanelOpen(true);
        if (section === 'upload') fetchUserImages();
      }
    };
  
    const handleUploadComplete = (uploadResult) => {
      if (uploadResult.success) {
        const newImage = { id: uploadResult.imageId, image_url: uploadResult.imageUrl };
        const newImageList = [newImage, ...uploadedImages];
        setUploadedImages(newImageList);
        onImagesLoaded(newImageList.map(img => img.image_url));
      }
      setUploadModalOpen(false);
    };
  
    const handleRemoveImage = async (imageIdToRemove) => {
      try {
        await ImageService.deleteImage(imageIdToRemove);
        const newImageList = uploadedImages.filter(image => image.id !== imageIdToRemove);
        setUploadedImages(newImageList);
        onImagesLoaded(newImageList.map(img => img.image_url));
      } catch (error) {
        console.error("Failed to delete image:", error);
      }
    };
  
    return (
      <div className="flex h-full bg-white shadow-md">
        <ImageUploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onUploadComplete={handleUploadComplete} />
        <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 space-y-3">
          <Link to="/user-games" className="p-2 rounded-lg text-gray-600 hover:bg-gray-200"><ArrowLeft size={20} /></Link>
          <SidebarButton icon={<UploadCloud size={24} strokeWidth={activeSection === 'upload' ? 2.5 : 2} />} isActive={activeSection === 'upload'} onClick={() => handleSectionClick('upload')} />
        </div>
        <div className={`transition-all duration-300 ease-in-out ${isPanelOpen && activeSection ? 'w-72' : 'w-0'} overflow-hidden`}>
          <div className="w-72 p-4 flex flex-col h-full">
            {activeSection === 'upload' && (
              <div className="flex flex-col h-full">
                <h3 className="font-bold text-lg mb-4">Mis Imágenes</h3>
                <button onClick={() => setUploadModalOpen(true)} className="w-full flex-shrink-0 flex items-center justify-center gap-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold mb-4">
                  <ImageIcon size={16} />
                  <span className="text-white">Añadir Imagen</span>
                </button>
                <p className="text-xs text-gray-500 mb-2">Arrastra una imagen a una pregunta.</p>
                <div className="overflow-y-auto grid grid-cols-2 pr-2 image-grid-container">
                  {uploadedImages.map((image) => (
                    <div 
                      key={image.id} 
                      className="relative group h-24 rounded-lg bg-gray-100 flex justify-center items-center cursor-grab"
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, image.image_url)}
                    >
                      <img src={image.image_url} alt={`preview ${image.id}`} className="object-contain max-h-full max-w-full image-preview-thumbnail" />
                      <button onClick={() => handleRemoveImage(image.id)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
}

const ImageUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef();
  
    if (!isOpen) return null;
  
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Formato no válido. Solo se permite JPG, PNG o GIF.');
        return;
      }
      setError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    };
  
    const handleUpload = async () => {
      if (!selectedFile) return;
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      const formData = new FormData();
      formData.append('image', selectedFile);
      try {
        const response = await apiClient.post('/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          },
        });
        onUploadComplete(response.data);
        resetState();
      } catch (err) {
        const message = err.response?.data?.message || 'Error al subir la imagen.';
        setError(message);
      } finally {
        setIsUploading(false);
      }
    };
  
    const triggerFileSelect = () => fileInputRef.current.click();
    const resetState = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      setIsUploading(false);
      setUploadProgress(0);
      if (isOpen) onClose();
    };
  
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header"><h3 className="modal-title">Subir Imagen</h3><button onClick={resetState} className="modal-close-button"><X size={24} /></button></div>
          <div className="modal-body">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/gif" style={{ display: 'none' }} />
            {previewUrl ? (
              <div className="image-preview-wrapper modal-preview"><img src={previewUrl} alt="Vista previa" className="image-preview" /></div>
            ) : (
              <div className="upload-placeholder" onClick={triggerFileSelect}>
                <UploadCloud size={48} className="text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Haz clic para seleccionar una imagen</p>
                <p className="text-xs text-gray-500">PNG, JPG o GIF (máx. 5MB)</p>
              </div>
            )}
            {error && <div className="upload-error">{error}</div>}
            {isUploading && (
              <div className="upload-progress-container">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                <span className="upload-progress-text">Subiendo... {uploadProgress}%</span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button onClick={resetState} className="button-secondary">Cancelar</button>
            <button onClick={handleUpload} className="button-primary" disabled={!selectedFile || isUploading}>{isUploading ? 'Subiendo...' : 'Subir'}</button>
          </div>
        </div>
      </div>
    );
};

const MainContent = ({ game, isAutoSaving, onSetQuestionImage, isPublic, onStateChange, onTitleChange, styles }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editableTitle, setEditableTitle] = useState('');

    useEffect(() => {
        if (game) {
            setEditableTitle(game.title);
        }
    }, [game]);

    const handleTitleDoubleClick = () => {
        setIsEditingTitle(true);
    };

    const handleTitleChange = (e) => {
        setEditableTitle(e.target.value);
    };

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        onTitleChange(editableTitle);
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleTitleBlur();
        }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const imageUrl = e.dataTransfer.getData('text/plain');
      if (imageUrl) {
        onSetQuestionImage(currentQuestionIndex, imageUrl);
      }
    };
  
    const handleDragOver = (e) => {
      e.preventDefault();
    };
  
    const handleDragEnter = () => {
      setIsDraggingOver(true);
    };
  
    const handleDragLeave = () => {
      setIsDraggingOver(false);
    };
  
    if (!game || !game.questions || game.questions.length === 0) {
      return (
        <div className="flex-1 p-8 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <Loader size={48} className="mx-auto text-gray-400 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">Cargando Juego...</h2>
            <p className="mt-2 text-sm text-gray-500">Por favor, espera un momento.</p>
          </div>
        </div>
      );
    }
  
    const currentQuestion = game.questions[currentQuestionIndex];
    const goToNext = () => setCurrentQuestionIndex(prev => Math.min(prev + 1, game.questions.length - 1));
    const goToPrevious = () => setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));
  
    return (
      <div className="flex-1 flex flex-col bg-gray-100">
        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div>
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={editableTitle}
                        onChange={handleTitleChange}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="text-xl font-bold bg-transparent border-b-2 border-blue-500 outline-none"
                        autoFocus
                    />
                ) : (
                    <h1 onDoubleClick={handleTitleDoubleClick} className="text-xl font-bold cursor-pointer">
                        {game.title}
                    </h1>
                )}
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center gap-8">
              {typeof isPublic !== 'undefined' && (
                  <GameStateSelector isPublic={isPublic} onStateChange={onStateChange} />
              )}
              <AutoSaveIndicator isSaving={isAutoSaving} />
          </div>
          <button onClick={() => { /* TODO: Implement share functionality */ }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700">
            <Share2 size={16} /> Compartir
          </button>
        </div>
        <div className="ai-game-questions-container">
          <button onClick={goToPrevious} disabled={currentQuestionIndex === 0} className="ai-game-nav-arrow left"><ChevronLeft size={32} /></button>
          <div className="ai-game-question-card-wrapper">
            <div className="ai-game-question-card">
                <div className="timer-circle" style={{ backgroundColor: styles.timerBg, color: styles.timerTextColor }}>15</div>
              <div className="mb-6">
                <p className="text-sm text-gray-500">Pregunta {currentQuestionIndex + 1} de {game.questions.length}</p>
                <p className="ai-game-question-text">{currentQuestion.question_text}</p>
              </div>
              <div 
                className={`question-image-dropzone ${isDraggingOver ? 'dragging-over' : ''} ${currentQuestion.imageUrl ? 'has-image' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
              >
                {currentQuestion.imageUrl ? (
                  <img src={currentQuestion.imageUrl} alt="Pregunta" className="question-image-preview" />
                ) : (
                  <div className="text-center text-gray-500">
                    <ImageIcon size={32} className="mx-auto"/>
                    <p className="mt-2 text-sm">Arrastra una imagen aquí</p>
                  </div>
                )}
              </div>
              <div className="ai-game-answer-grid">
                {currentQuestion.answers.map((ans, ansIndex) => (
                  <div 
                      key={ansIndex} 
                      className={`ai-game-answer-button ${ans.is_correct ? 'correct' : 'incorrect'}`}
                      style={{ borderRadius: `${styles.buttonRadius}px` }}
                  >
                      {ans.answer_text}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={goToNext} disabled={currentQuestionIndex === game.questions.length - 1} className="ai-game-nav-arrow right"><ChevronRight size={32} /></button>
        </div>
      </div>
    );
};

const AIStyleAssistant = ({ setStyles }) => {
    // This component is reused as is
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const handleGenerate = async () => {
      if (!description.trim()) {
        setError('Por favor, describe el estilo que buscas.');
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await AIGameViewModel.generateStyle(description);
        if (result.error) {
          setError(result.message || 'No se pudo generar el estilo.');
        } else {
          setStyles(prev => ({...prev, ...result}));
        }
      } catch (err) {
        setError(err.message || 'Ocurrió un error inesperado.');
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-500 flex items-center gap-2"><Wand2 size={14}/> ASISTENTE DE ESTILOS IA</h4>
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs text-indigo-700 mb-2">Describe un tema o una emoción y la IA generará una paleta de colores.</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Un tema de naturaleza para niños..."
            className="w-full p-2 border-gray-300 rounded-lg text-sm"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:bg-indigo-400 transition-all"
          >
            {isLoading ? <><Loader size={16} className="animate-spin"/> Generando...</> : <>Generar Estilo</>}
          </button>
          {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
        </div>
      </div>
    );
};

const StyleControlPanel = ({ styles, setStyles }) => {
    // This component is reused as is
    const presets = [
        { name: 'Claro', containerBg: '#FFFFFF', questionText: '#111827', answerBg: '#F9FAFB', answerTextColor: '#1F2937', timerBg: '#3B82F6', timerTextColor: '#FFFFFF' },
        { name: 'Oscuro', containerBg: '#1F2937', questionText: '#F9FAFB', answerBg: '#374151', answerTextColor: '#F3F4F6', timerBg: '#FBBF24', timerTextColor: '#1F2937' },
        { name: 'Océano', containerBg: '#F0F9FF', questionText: '#0C4A6E', answerBg: '#E0F2FE', answerTextColor: '#075985', timerBg: '#10B981', timerTextColor: '#FFFFFF' },
        { name: 'Bosque', containerBg: '#F0FDF4', questionText: '#14532D', answerBg: '#DCFCE7', answerTextColor: '#166534', timerBg: '#F59E0B', timerTextColor: '#FFFFFF' },
        { name: 'Atardecer', containerBg: '#FFF7ED', questionText: '#7C2D12', answerBg: '#FFEDD5', answerTextColor: '#9A3412', timerBg: '#EF4444', timerTextColor: '#FFFFFF' },
        { name: 'Neón', containerBg: '#1A1A1A', questionText: '#E0E0E0', answerBg: '#333333', answerTextColor: '#A7F3D0', timerBg: '#EC4899', timerTextColor: '#1A1A1A' },
      ];
  
    const handleColorChange = (key, value) => {
      setStyles(prev => ({ ...prev, [key]: value }));
    };
  
    const ColorInput = ({ label, colorKey }) => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex items-center gap-2 p-1 border border-gray-200 rounded-lg">
          <input
            type="color"
            value={styles[colorKey]}
            onChange={(e) => handleColorChange(colorKey, e.target.value)}
            className="p-0 h-8 w-8 block bg-white border-none rounded-md cursor-pointer"
          />
          <input 
            type="text"
            value={styles[colorKey]}
            onChange={(e) => handleColorChange(colorKey, e.target.value)}
            className="w-full p-1 border-gray-300 rounded-md text-sm font-mono bg-gray-50"
          />
        </div>
      </div>
    );

    const SliderControl = ({ title, value, onChange, min = 0, max = 24 }) => (
        <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase">{title}</h4>
            <div className="flex items-center gap-4 mt-2">
                <input 
                    type="range" 
                    min={min}
                    max={max}
                    value={value}
                    onChange={onChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-600 w-8 text-center">{value}px</span>
            </div>
        </div>
      );
  
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-center gap-2">
          <Palette size={20} className="text-gray-600"/>
          <h3 className="font-bold text-center">Personalizar Diseño</h3>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-500">COLORES MANUALES</h4>
            <ColorInput label="Fondo de la Tarjeta" colorKey="containerBg" />
            <ColorInput label="Texto de la Pregunta" colorKey="questionText" />
            <ColorInput label="Fondo de Respuestas" colorKey="answerBg" />
            <ColorInput label="Texto de Respuestas" colorKey="answerTextColor" />
            <ColorInput label="Fondo del Contador" colorKey="timerBg" />
            <ColorInput label="Texto del Contador" colorKey="timerTextColor" />
          </div>
          <hr />
          <div className="space-y-4">
            <SliderControl 
                title="Redondez de Botones"
                value={styles.buttonRadius}
                onChange={(e) => setStyles(prev => ({...prev, buttonRadius: parseInt(e.target.value, 10)}))}
            />
        </div>
          <hr />
          <AIStyleAssistant setStyles={setStyles} />
          <hr />
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-500">ESTILOS RECOMENDADOS</h4>
            <div className="grid grid-cols-3 gap-3">
              {presets.map(preset => (
                <div key={preset.name} className="text-center">
                  <button onClick={() => setStyles(prev => ({...prev, ...preset}))} className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" style={{ background: `linear-gradient(45deg, ${preset.containerBg} 50%, ${preset.answerBg} 50%)`, border: '2px solid #e5e7eb' }}>
                     <div className="w-4 h-4 rounded-full" style={{backgroundColor: preset.questionText}}></div>
                  </button>
                  <p className="text-xs mt-2 font-medium text-gray-600">{preset.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
};

// --- Main Screen Component ---

const GameEditorScreen = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  
  const [styles, setStyles] = useState({
    containerBg: '#ffffff',
    questionText: '#1f2937',
    answerBg: '#f3f4f6',
    answerTextColor: '#1f2937',
    buttonRadius: 8,
    timerBg: '#EF4444',
    timerTextColor: '#FFFFFF',
  });

  const debounceTimeoutRef = useRef(null);

  // Load game data on mount
  useEffect(() => {
    const loadGame = async () => {
      const result = await GameViewModel.getGameById(gameId);
      if (result.success) {
        const loadedGame = result.game;
        setGameData(loadedGame);

        let loadedStyles = {};
        if (loadedGame.styles) {
            if (typeof loadedGame.styles === 'string') {
                try {
                    loadedStyles = JSON.parse(loadedGame.styles);
                } catch (e) {
                    console.error("Failed to parse styles JSON:", e);
                }
            } else {
                loadedStyles = loadedGame.styles;
            }
        }
        
        // Merge loaded styles with defaults to ensure all keys are present
        setStyles(prevStyles => ({...prevStyles, ...loadedStyles}));

        setIsPublic(loadedGame.is_public || false);
      } else {
        setSaveError("No se pudo cargar el juego.");
      }
    };
    loadGame();
  }, [gameId]);

  const handleAutoSave = useCallback(async (currentGameData) => {
    if (!currentGameData) return;
    setIsAutoSaving(true);
    setSaveError(null);
    try {
      const dataToSave = { ...currentGameData, styles, is_public: isPublic };
      delete dataToSave.isPublic;
      const result = await AIGameViewModel.updateGame(gameId, dataToSave);
      if (!result.success) {
        setSaveError(result.message || 'Error en el autoguardado.');
      }
    } catch (error) {
      setSaveError(error.message || 'Error de conexión durante el autoguardado.');
    } finally {
      setIsAutoSaving(false);
    }
  }, [gameId, styles, isPublic]);

  // Auto-save effect
  useEffect(() => {
    if (gameData) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        handleAutoSave(gameData);
      }, 2000);
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [gameData, styles, handleAutoSave]);

  const screenStyle = {
    '--container-bg': styles.containerBg,
    '--question-text-color': styles.questionText,
    '--answer-bg': styles.answerBg,
    '--answer-text-color': styles.answerTextColor,
  };

  const handleSetQuestionImage = (questionIndex, imageUrl) => {
    if (!gameData) return;
    const updatedQuestions = [...gameData.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      imageUrl: imageUrl,
    };
    setGameData({
      ...gameData,
      questions: updatedQuestions,
    });
  };

  const handleTitleChange = (newTitle) => {
    if (!gameData) return;
    setGameData({
        ...gameData,
        title: newTitle,
    });
  };

  return (
    <div className="flex h-screen bg-white" style={screenStyle}>
      <NewSidebar onImagesLoaded={setImageUrls} />
      <div className="flex-1 flex flex-col">
        <MainContent 
          game={gameData} 
          isAutoSaving={isAutoSaving}
          onSetQuestionImage={handleSetQuestionImage}
          isPublic={isPublic}
          onStateChange={setIsPublic}
          onTitleChange={handleTitleChange}
          styles={styles}
        />
        {saveError && <div className="p-4 text-center text-sm text-red-600 bg-red-100">{saveError}</div>}
      </div>
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {gameData ? (
          <StyleControlPanel styles={styles} setStyles={setStyles} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Loader className="animate-spin text-gray-400" size={48} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameEditorScreen;
