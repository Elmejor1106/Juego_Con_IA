import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../model/data/api/apiClient';
import { ArrowLeft, Share2, Bot, Loader, Wand2, Palette, ChevronLeft, ChevronRight, UploadCloud, Image as ImageIcon, X, CheckCircle2, Cloud, HelpCircle } from 'lucide-react';
import AIGameViewModel from '../../../viewModel/game/AIGameViewModel';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import ImageService from '../../../model/business_logic/services/ImageService';
import SuccessModal from '../../components/common/SuccessModal';
import ShareModal from '../../components/game/ShareModal';
import './CreateGameAIScreen.css'; // Reusing the same CSS
import { AIStyleAssistant } from './CreateGameAIScreen';
import ImageSuggestions from '../../components/game/ImageSuggestions';

// Imagen transparente de 1x1 pixel en base64 (invisible)
const DEFAULT_TRANSPARENT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=';

// Helper function para verificar si una imagen es la transparente por defecto
const isDefaultTransparentImage = (imageUrl) => {
  return imageUrl && imageUrl.startsWith(DEFAULT_TRANSPARENT_IMAGE);
};

// --- Helper Components ---

const AutoSaveIndicator = ({ isSaving }) => {
    const [showSaved, setShowSaved] = useState(false);
    const prevIsSaving = useRef(false);

    useEffect(() => {
        if (prevIsSaving.current && !isSaving) {
            setShowSaved(true);
            const timer = setTimeout(() => {
                setShowSaved(false);
            }, 2000);
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
        onImagesLoaded(images); // Pasar las imágenes completas en lugar de solo URLs
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
    // Si es un refresh de imágenes
    if (uploadResult.refresh && uploadResult.images) {
      setUploadedImages(uploadResult.images);
      onImagesLoaded(uploadResult.images); // Pasar las imágenes completas
      return;
    }
    
    // Si es una subida normal
    if (uploadResult.success) {
      const newImage = { id: uploadResult.imageId, image_url: uploadResult.imageUrl };
      const newImageList = [newImage, ...uploadedImages];
      setUploadedImages(newImageList);
      onImagesLoaded(newImageList); // Pasar las imágenes completas
    }
    setUploadModalOpen(false);
  };

  const handleRemoveImage = async (imageIdToRemove) => {
    try {
      await ImageService.deleteImage(imageIdToRemove);
      const newImageList = uploadedImages.filter(image => image.id !== imageIdToRemove);
      setUploadedImages(newImageList);
      onImagesLoaded(newImageList); // Pasar las imágenes completas
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  return (
    <div className="flex h-full bg-white shadow-md">
      <ImageUploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onUploadComplete={handleUploadComplete} />
      <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 space-y-3">
        <Link to="/user-games" className="p-2 rounded-lg text-gray-600 hover:bg-gray-200"><ArrowLeft size={20} /></Link>
        <SidebarButton icon={<HelpCircle size={24} strokeWidth={activeSection === 'ia' ? 2.5 : 2} />} isActive={activeSection === 'ia'} onClick={() => handleSectionClick('ia')} />
        <SidebarButton icon={<UploadCloud size={24} strokeWidth={activeSection === 'upload' ? 2.5 : 2} />} isActive={activeSection === 'upload'} onClick={() => handleSectionClick('upload')} />
      </div>
      <div className={`transition-all duration-300 ease-in-out ${isPanelOpen && activeSection ? 'w-72' : 'w-0'} overflow-hidden`}>
        <div className="w-72 p-4 flex flex-col h-full">
          {activeSection === 'ia' && (
            <div>
              <h3 className="font-bold text-lg mb-3">Asistente IA</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Usa el formulario de la derecha para definir los requisitos de tu juego.</p>
                <p>Añadir detalles puede mejorar la calidad del juego generado por la IA.</p>
              </div>
            </div>
          )}
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
              <div className="image-preview-wrapper modal-preview"><img src={previewUrl} alt="Vista previa" className="modal-preview-image" /></div>
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

// Modal de selección de imágenes para el editor
const ImageSelectionModal = ({ isOpen, onClose, onSelectImage, currentQuestion, uploadedImages, onUploadComplete, onRefreshImages }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('ai'); // 'ai' o 'user'
  const fileInputRef = useRef();

  // Refrescar imágenes cuando se abre el modal o se cambia a la sección de usuario
  useEffect(() => {
    if (isOpen && activeSection === 'user' && onRefreshImages) {
      onRefreshImages();
    }
  }, [isOpen, activeSection, onRefreshImages]);

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
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Seleccionar Imagen</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        {/* Botones de navegación de secciones */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSection('ai')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeSection === 'ai' 
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Bot size={18} />
            Sugerencias de IA
          </button>
          <button
            onClick={() => setActiveSection('user')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeSection === 'user' 
                ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <ImageIcon size={18} />
            Mis Imágenes
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Sección de Sugerencias de IA */}
          {activeSection === 'ai' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-gray-600 text-sm">
                  Selecciona una imagen sugerida por la IA basada en tu pregunta
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <ImageSuggestions
                  query={currentQuestion?.question_text || ''}
                  onSelectImage={(imageUrl) => {
                    onSelectImage(imageUrl);
                    handleClose();
                  }}
                />
              </div>
            </div>
          )}

          {/* Sección de Imágenes del Usuario */}
          {activeSection === 'user' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 text-sm">
                  Selecciona una de tus imágenes subidas o añade una nueva
                </p>
                <button 
                  onClick={triggerFileSelect}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <UploadCloud size={16} />
                  Subir Nueva
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Vista previa de archivo seleccionado */}
              {previewUrl && (
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-4">
                    <img src={previewUrl} alt="Preview" className="w-16 h-16 modal-preview-image rounded" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedFile?.name}</p>
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isUploading ? `Subiendo... ${uploadProgress}%` : 'Confirmar Subida'}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                </div>
              )}

              {/* Grid de imágenes subidas */}
              <div className="grid grid-cols-4 gap-4 modal-image-grid">
                {uploadedImages.map((image) => (
                  <div 
                    key={image.id} 
                    className="relative group cursor-pointer hover:opacity-80 transition-opacity aspect-square"
                    onClick={() => {
                      onSelectImage(image.image_url);
                      handleClose();
                    }}
                  >
                    <img 
                      src={image.image_url} 
                      alt={`Imagen ${image.id}`} 
                      className="w-full h-full object-cover rounded border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-white opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                ))}
              </div>

              {uploadedImages.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No tienes imágenes subidas aún</p>
                  <p className="text-sm">Haz clic en "Subir Nueva" para agregar tu primera imagen</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MainContent = ({ game, isAutoSaving, onSetQuestionImage, isPublic, onStateChange, onTitleChange, styles, layout, layoutKey, uploadedImages, onUploadComplete, onShareClick }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editableTitle, setEditableTitle] = useState('');
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    // Handlers para drag and drop de imágenes
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const imageUrl = e.dataTransfer.getData('text/plain');
        if (imageUrl && onSetQuestionImage) {
            onSetQuestionImage(currentQuestionIndex, imageUrl);
        }
    };

    useEffect(() => {
        if (game) {
            setEditableTitle(game.title);
        }
    }, [game]);

  // Diagnostic: log when layout prop changes so we can verify MainContent receives updates
  useEffect(() => {
    console.log('GameEditor MainContent layout prop changed:', layout);
  }, [layout]);

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
                <button 
                    onClick={onShareClick} 
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!game || !game.id}
                    title={!game || !game.id ? "Guarda el juego primero para poder compartirlo" : "Compartir juego"}
                >
                    <Share2 size={16} /> Compartir
                </button>
            </div>
            <div className={`ai-game-questions-container layout-${layoutKey}`}>
                <button onClick={goToPrevious} disabled={currentQuestionIndex === 0} className="ai-game-nav-arrow left"><ChevronLeft size={32} /></button>
        <div className="ai-game-question-card-wrapper">
          <div className="ai-game-question-card" style={{ backgroundColor: styles.containerBg, margin: '0 auto' }}>
            {/* Timer: position adjusted slightly per layoutKey so it visually matches the preview */}
            {(() => {
              const base = { position: 'absolute' };
              let timerPos = { top: '10px', right: '10px' };
              if (layoutKey === 'image-left') timerPos = { top: '10px', left: '10px' };
              if (layoutKey === 'compact') timerPos = { top: '6px', left: '140px' };
              return (
                <div className="timer-circle" style={{ ...base, ...timerPos, backgroundColor: styles.timerBg, color: styles.timerTextColor }}>
                  15
                </div>
              );
            })()}

            {/* Question header */}
            <div className="mb-6 text-center">
              <p className="text-sm" style={{ color: '#6b7280' }}>Pregunta {currentQuestionIndex + 1} de {game.questions.length}</p>
              <h2 className="text-3xl font-bold mt-2" style={{ color: styles.questionText }}>{currentQuestion.question_text}</h2>
            </div>

            {/* Image section */}
            <div 
              className={`question-image-dropzone ${isDragOver ? 'dragging-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {currentQuestion.imageUrl && !isDefaultTransparentImage(currentQuestion.imageUrl) ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src={currentQuestion.imageUrl} alt="Pregunta" className="question-image-preview" />
                  <button
                    onClick={() => setIsImageModalOpen(true)}
                    className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Cambiar Imagen
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
                  <ImageIcon size={48} className="mb-4 opacity-50" />
                  <button
                    onClick={() => setIsImageModalOpen(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg text-lg"
                  >
                    <ImageIcon size={24} />
                    Subir Imagen
                  </button>
                  <p className="text-sm mt-3 opacity-75">Haz clic para seleccionar una imagen o arrastra una desde el panel lateral</p>
                </div>
              )}
            </div>

            {/* Modal de selección de imágenes */}
            <ImageSelectionModal
              isOpen={isImageModalOpen}
              onClose={() => setIsImageModalOpen(false)}
              onSelectImage={(imageUrl) => onSetQuestionImage(currentQuestionIndex, imageUrl)}
              currentQuestion={currentQuestion}
              uploadedImages={uploadedImages}
              onUploadComplete={onUploadComplete}
              onRefreshImages={() => {
                // Callback para refrescar imágenes cuando se abre el modal
                const fetchImages = async () => {
                  try {
                    const images = await ImageService.getMyImages();
                    // Usar el handler correcto para actualizar las imágenes
                    setUploadedImages(images);
                    onImagesLoaded(images.map(img => img.image_url));
                  } catch (error) {
                    console.error("Failed to refresh images:", error);
                  }
                };
                fetchImages();
              }}
            />

            {/* Answers grid */}
            <div className="ai-game-answer-grid" style={{ marginTop: '0.75rem' }}>
              {currentQuestion.answers.map((ans, ansIndex) => (
                <div key={ans.id || ansIndex} className={`ai-game-answer-button ${ans.is_correct ? 'correct' : 'incorrect'}`} style={{ borderRadius: `${styles.buttonRadius}px`, backgroundColor: styles.answerBg, color: styles.answerTextColor }}>
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





const StyleControlPanel = ({ styles, setStyles }) => {
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
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Layout presets map keys to absolute positions used in previews and runtime
  const LAYOUT_PRESETS = {
    'default': { question: { x: 40, y: 140 }, image: { x: 225, y: 20 }, answers: { x: 40, y: 250 }, timer: { x: 650, y: 20 } },
  };

  const [layoutKey, setLayoutKey] = useState('default');
  const [layout, setLayout] = useState(LAYOUT_PRESETS['default']); // object with positions used to render

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

        setStyles(prevStyles => ({...prevStyles, ...loadedStyles}));

        // Always use default layout
        setLayoutKey('default');
        setLayout(LAYOUT_PRESETS['default']);

        setIsPublic(loadedGame.is_public || false);

      } else {
        setSaveError("No se pudo cargar el juego.");
      }
    };
    loadGame();
  }, [gameId]);

  // Cargar imágenes subidas por el usuario
  useEffect(() => {
    const fetchUserImages = async () => {
      try {
        const images = await ImageService.getMyImages();
        setUploadedImages(images);
      } catch (error) {
        console.error("Failed to fetch user images:", error);
      }
    };
    fetchUserImages();
  }, []);

  // Función para asegurar que todas las preguntas tengan una imagen
  const ensureDefaultImages = (questions) => {
    return questions.map(question => ({
      ...question,
      imageUrl: question.imageUrl || DEFAULT_TRANSPARENT_IMAGE,
      hasUserImage: !!question.imageUrl // Flag para saber si el usuario agregó una imagen real
    }));
  };

  const handleAutoSave = useCallback(async (currentGameData) => {
    if (!currentGameData) return;
    setIsAutoSaving(true);
    setSaveError(null);
    try {
      // Asegurar que todas las preguntas tengan una imagen (agregar imagen transparente si no hay)
      const questionsWithImages = ensureDefaultImages(currentGameData.questions || []);
      
      // Ensure layout is a string before saving
      // Save layout as key if not custom, otherwise as object
      const dataToSave = { 
        ...currentGameData, 
        questions: questionsWithImages,
        styles, 
        layout: layoutKey !== 'custom' ? layoutKey : layout, 
        is_public: isPublic 
      };
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
  }, [gameId, styles, layout, isPublic]);

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
  }, [gameData, styles, layout, handleAutoSave]);

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

  const handleUploadComplete = (uploadResult) => {
    // Si es un refresh de imágenes (desde el modal de selección)
    if (uploadResult.refresh && uploadResult.images) {
      setUploadedImages(uploadResult.images);
      return;
    }
    
    // Si es una subida normal
    if (uploadResult.success) {
      const newImage = { id: uploadResult.imageId, image_url: uploadResult.imageUrl };
      setUploadedImages(prev => [newImage, ...prev]);
    }
  };

  const handleTitleChange = (newTitle) => {
    if (!gameData) return;
    setGameData({
        ...gameData,
        title: newTitle,
    });
  };

  const handleSidebarImagesUpdate = (images) => {
    setImageUrls(images.map(img => img.image_url));
    setUploadedImages(images);
  };

  return (
    <div className="flex h-screen bg-white" style={screenStyle}>
  <NewSidebar onImagesLoaded={handleSidebarImagesUpdate} />
      <div className="flex-1 flex flex-col">
            <MainContent 
              game={gameData} 
              isAutoSaving={isAutoSaving}
              onSetQuestionImage={handleSetQuestionImage}
              isPublic={isPublic}
              onStateChange={setIsPublic}
              onTitleChange={handleTitleChange}
              styles={styles}
              layout={layout}
              layoutKey={layoutKey}
              uploadedImages={uploadedImages}
              onUploadComplete={handleUploadComplete}
              onShareClick={() => setIsShareModalOpen(true)}
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

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        gameId={gameData?.id}
        gameTitle={gameData?.title}
      />
    </div>
  );
};

export default GameEditorScreen;
