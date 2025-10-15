import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../../model/data/api/apiClient';
import { ArrowLeft, Share2, Bot, Loader, Wand2, BookOpen, Languages, Hash, Users, Award, Mic, Brain, ChevronLeft, ChevronRight, UploadCloud, Image as ImageIcon, X, PanelLeftClose, PanelLeftOpen, HelpCircle, Palette, CheckCircle2, Cloud } from 'lucide-react';
import AIGameViewModel from '../../../viewModel/game/AIGameViewModel';
import ImageService from '../../../model/business_logic/services/ImageService';
import SuccessModal from '../../components/common/SuccessModal';
import ShareModal from '../../components/game/ShareModal';
import ImageSuggestions from '../../components/game/ImageSuggestions';
import './CreateGameAIScreen.css';

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

// Simple LayoutSelector component shared by CreateGameAIScreen and GameEditorScreen
export const LayoutSelector = ({ setLayout, selectedLayout, onSelectLayout }) => {
  const layouts = [
    { key: 'default', label: 'Default' },
  ];

  const cardStyle = {
    width: 240,
    height: 150,
    borderRadius: 10,
    padding: 10,
    boxSizing: 'border-box',
    background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
    border: '1px solid rgba(226,232,240,0.8)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    boxShadow: '0 6px 16px rgba(15,23,42,0.08)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  };

  const Header = ({ text }) => (
    <div style={{ height: 18, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#374151' }}>{text}</div>
  );

  const ImageBlock = () => (
    <div style={{ height: 44, borderRadius: 6, background: '#e6f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#0c4a6e' }}>Imagen</div>
  );

  const AnswersBlock = () => (
    <div style={{ display: 'flex', gap: 6 }}>
      <div style={{ flex: 1, height: 20, borderRadius: 6, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>Respuesta 1</div>
      <div style={{ flex: 1, height: 20, borderRadius: 6, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>Respuesta 2</div>
    </div>
  );

  const Timer = ({ position = 'top-right', bg, textColor }) => {
    const base = { width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#111827', fontWeight: 600 };
    const defaultMap = {
      'top-right': { position: 'absolute', top: 8, right: 8, background: 'linear-gradient(180deg,#fed7aa,#fb7185)', ...base },
      'top-left': { position: 'absolute', top: 8, left: 8, background: 'linear-gradient(180deg,#bfdbfe,#3b82f6)', color: '#ffffff', ...base },
      'bottom-right': { position: 'absolute', bottom: 8, right: 8, background: 'linear-gradient(180deg,#bbf7d0,#10b981)', color: '#065f46', ...base },
      'bottom-left': { position: 'absolute', bottom: 8, left: 8, background: 'linear-gradient(180deg,#ddd6fe,#7c3aed)', color: '#ffffff', ...base },
    };

    const style = bg ? { position: 'absolute', ...(position === 'top-right' && { top: 8, right: 8 }), ...(position === 'top-left' && { top: 8, left: 8 }), ...(position === 'bottom-right' && { bottom: 8, right: 8 }), ...(position === 'bottom-left' && { bottom: 8, left: 8 }), background: bg, color: textColor || '#fff', ...base } : (defaultMap[position] || defaultMap['top-right']);

    return <div style={style}>15</div>;
  };

  const Preview = ({ type }) => {
    // Each preview renders the same elements but arranged according to layout type; use sample text
    const container = (children) => (
      <div style={{ ...cardStyle, position: 'relative', background: 'transparent' }}>
        {children}
      </div>
    );

    const compactPreview = (timerPos = 'top-left') => container(
      <>
        <Header text="Pregunta" />
        {/* Insert image between question and answers for compact (template 3) */}
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div style={{ width: 96, height: 56, borderRadius: 6, background: '#e6f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0c4a6e', fontSize: 11 }}>Imagen</div>
        </div>
        <AnswersBlock />
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}><div style={{ fontSize: 10, color: '#6b7280' }}>Ejemplo</div></div>
        <Timer position={timerPos} bg={'#EF4444'} textColor={'#FFFFFF'} />
      </>
    );

    if (type === 'compact') {
      return compactPreview('top-left');
    }

    if (type === 'image-left') {
      return container(
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '72px 1fr', gridTemplateRows: 'auto 1fr', gap: 6 }}>
          {/* timer top-left */}
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <Timer position={'top-left'} bg={'#EF4444'} textColor={'#FFFFFF'} />
          </div>

          <div style={{ gridColumn: '1 / 2', gridRow: '1 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 6, background: '#e6f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0c4a6e' }}>Img</div>
          </div>

          <div style={{ gridColumn: '2 / 3', gridRow: '1 / 2' }}>
            <Header text="Pregunta" />
            <div style={{ height: 8 }} />
          </div>

          <div style={{ gridColumn: '2 / 3', gridRow: '2 / 3' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div style={{ background: '#f8fafc', height: 18, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>Respuesta 1</div>
              <div style={{ background: '#f8fafc', height: 18, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>Respuesta 2</div>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'image-right') {
      // Build a mini card that mirrors the runtime layout: question top-left, answers below, image at right, timer top-right
      return container(
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 72px', gridTemplateRows: 'auto 1fr', gap: 6 }}>
          {/* timer top-right */}
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <Timer position={'top-right'} bg={'#EF4444'} textColor={'#FFFFFF'} />
          </div>

          <div style={{ gridColumn: '1 / 2', gridRow: '1 / 2' }}>
            <Header text="Pregunta" />
            <div style={{ height: 8 }} />
          </div>

          <div style={{ gridColumn: '2 / 3', gridRow: '1 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 6, background: '#e6f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0c4a6e' }}>Img</div>
          </div>

          <div style={{ gridColumn: '1 / 2', gridRow: '2 / 3' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div style={{ background: '#f8fafc', height: 18, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>Respuesta 1</div>
              <div style={{ background: '#f8fafc', height: 18, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>Respuesta 2</div>
            </div>
          </div>
        </div>
      );
    }

  // default: reuse compact preview but place the timer at top-right to match template 4
  return compactPreview('top-right');
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-2">Previsualizaciones de plantilla (columna, orden descendente):</p>
      <div className="flex flex-col gap-3">
        {layouts.slice().reverse().map(l => {
          const handleClick = () => {
            console.log('LayoutSelector clicked:', l.key);
            if (onSelectLayout) onSelectLayout(l.key);
            else if (setLayout) setLayout(l.key);
          };

          return (
            <button
              key={l.key}
              type="button"
              onClick={handleClick}
              className={`flex items-center gap-3 p-2 rounded-md ${selectedLayout === l.key ? 'ring-2 ring-indigo-200' : 'hover:bg-gray-50'}`}
              aria-pressed={selectedLayout === l.key}
              aria-label={l.label}
              title={l.label}
              style={{ border: selectedLayout === l.key ? '2px solid #4f46e5' : '1px solid #e6e6e6', background: '#fff', cursor: 'pointer' }}
            >
              <div className="template-preview-wrapper">
                  <Preview type={l.key} />
                </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};



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
    // Si es un refresh de imágenes
    if (uploadResult.refresh && uploadResult.images) {
      setUploadedImages(uploadResult.images);
      onImagesLoaded(uploadResult.images.map(img => img.image_url));
      return;
    }
    
    // Si es una subida normal
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

// Modal de selección de imágenes
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
    console.log('CreateGame MainContent layout prop changed:', layout);
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
                    <Bot size={48} className="mx-auto text-gray-400" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-700">Esperando para generar un juego</h2>
                    <p className="mt-2 text-sm text-gray-500">Completa el formulario y haz clic en "Generar Juego" para comenzar.</p>
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
            {/* Timer: positioned top-right for default layout */}
            <div className="timer-circle" style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: styles.timerBg, color: styles.timerTextColor }}>
              15
            </div>

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
                    className="absolute top-2 right-2 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-blue-700 shadow-lg"
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
                    // Usar onUploadComplete para forzar un refresh
                    onUploadComplete({ success: true, refresh: true, images });
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

const AIRequirementsForm = ({ setGeneratedGame }) => {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('Español');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('');
  const [focus, setFocus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Por favor, introduce un tema.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedGame(null);
    setProgress(0);
    const interval = setInterval(() => setProgress(prev => Math.min(prev + 10, 90)), 500);
    try {
      const requirements = { topic, language, count, difficulty, audience, tone, focus };
      const result = await AIGameViewModel.generateQuestions(requirements);
      clearInterval(interval);
      setProgress(100);
      if (result.error) {
        setError(result.message || 'Error generando las preguntas.');
        setGeneratedGame(null);
      } else {
        const gameData = { title: `Juego sobre ${topic}`, description: `Un juego con ${count} preguntas en ${language}.`, questions: result.questions };
        setGeneratedGame(gameData);
      }
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      setError(err.message || 'Ocurrió un error inesperado.');
      setGeneratedGame(null);
    } finally {
      setTimeout(() => { setIsLoading(false); setProgress(0); }, 1000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-gray-200"><h3 className="font-bold text-center">Define tu Juego</h3></div>
      <div className="flex-1 p-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="topic" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><BookOpen size={16}/>Tema del Juego</label>
            <input id="topic" type="text" placeholder="Ej: Capitales del mundo" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" disabled={isLoading} />
          </div>
          <div>
            <label htmlFor="language" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Languages size={16}/>Idioma</label>
            <input id="language" type="text" value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" disabled={isLoading} />
          </div>
          <div>
            <label htmlFor="count" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Hash size={16}/>Número de Preguntas</label>
            <input id="count" type="number" value={count} min="3" max="10" onChange={(e) => setCount(parseInt(e.target.value, 10))} className="w-full p-2 border border-gray-300 rounded-lg text-sm" disabled={isLoading} />
          </div>
          <hr/>
          <div>
            <label htmlFor="difficulty" className="flex items-center gap-2 text-sm font-medium text-gray-700"> <Award size={16}/> Nivel de Dificultad <span className="text-xs text-gray-500">(Opcional)</span></label>
            <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-2 mt-1 border border-gray-300 rounded-lg text-sm" disabled={isLoading}>
              <option value="">Cualquiera</option>
              <option value="Fácil">Fácil</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Difícil">Difícil</option>
              <option value="Experto">Experto</option>
            </select>
          </div>
          <div>
            <label htmlFor="audience" className="flex items-center gap-2 text-sm font-medium text-gray-700"> <Users size={16}/> Público Objetivo <span className="text-xs text-gray-500">(Opcional)</span></label>
            <input id="audience" type="text" placeholder="Ej: Niños de 10 años" value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full p-2 mt-1 border border-gray-300 rounded-lg text-sm" disabled={isLoading} />
          </div>
          <div>
            <label htmlFor="tone" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Mic size={16}/> Tono del Contenido <span className="text-xs text-gray-500">(Opcional)</span></label>
            <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2 mt-1 border border-gray-300 rounded-lg text-sm" disabled={isLoading}>
              <option value="">Por defecto</option>
              <option value="Humorístico">Humorístico</option>
              <option value="Académico">Académico</option>
              <option value="Directo y conciso">Directo y conciso</option>
              <option value="Creativo">Creativo</option>
            </select>
          </div>
          <div>
            <label htmlFor="focus" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Brain size={16}/> Enfoque Específico <span className="text-xs text-gray-500">(Opcional)</span></label>
            <textarea id="focus" placeholder="Ej: Solo sobre planetas rocosos" value={focus} onChange={(e) => setFocus(e.target.value)} className="w-full p-2 mt-1 border border-gray-300 rounded-lg text-sm" rows="3" disabled={isLoading}></textarea>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</div>}
          <button type="submit" className="ai-gen-button" disabled={isLoading}>
            <div className="ai-gen-button-progress" style={{ width: `${progress}%` }}></div>
            <div className="ai-gen-button-content">
              {isLoading ? <><Loader size={16} className="animate-spin"/> Generando ({progress}%)</> : <><Wand2 size={16}/>Generar Juego</>}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export const AIStyleAssistant = ({ setStyles }) => {
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
        <p className="text-xs text-indigo-700 mb-2">Describe un tema o una emoción y deja que la IA genere una paleta de colores para ti.</p>
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

const StyleControlPanel = ({ styles, setStyles, setLayout }) => {
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

const CreateGameAIScreen = () => {
  const [generatedGame, setGeneratedGame] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [gameId, setGameId] = useState(null); // ID for auto-saving
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [styles, setStyles] = useState({
    containerBg: '#ffffff',
    questionText: '#1f2937',
    answerBg: '#f3f4f6',
    answerTextColor: '#1f2937',
    buttonRadius: 8,
    timerBg: '#EF4444',
    timerTextColor: '#FFFFFF',
  });

  const LAYOUT_PRESETS = {
    'default': { question: { x: 40, y: 24 }, image: { x: 20, y: 48 }, answers: { x: 40, y: 120 }, timer: { x: 160, y: 8 } },
    'compact': { question: { x: 20, y: 10 }, image: { x: 20, y: 40 }, answers: { x: 20, y: 86 }, timer: { x: 140, y: 6 } },
    'image-left': { question: { x: 110, y: 14 }, image: { x: 18, y: 14 }, answers: { x: 110, y: 80 }, timer: { x: 170, y: 8 } },
    'image-right': { question: { x: 20, y: 14 }, image: { x: 330, y: 14 }, answers: { x: 20, y: 80 }, timer: { x: 320, y: 8 } },
  };

  const [layoutKey, setLayoutKey] = useState('default');
  const [layout, setLayout] = useState(LAYOUT_PRESETS['default']);

  // Restore unsaved layout selection from localStorage (helps if user navigates away before first save)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('unsaved_layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.key) {
          setLayoutKey(parsed.key);
          setLayout(LAYOUT_PRESETS[parsed.key] || LAYOUT_PRESETS['default']);
          console.log('Restored unsaved layout from localStorage:', parsed.key);
        }
      }
    } catch (err) {
      console.warn('Failed to restore unsaved layout:', err);
    }
  }, []);

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

  // Debounce timer
  const debounceTimeoutRef = useRef(null);

  // Función para asegurar que todas las preguntas tengan una imagen
  const ensureDefaultImages = (questions) => {
    return questions.map(question => ({
      ...question,
      imageUrl: question.imageUrl || DEFAULT_TRANSPARENT_IMAGE,
      hasUserImage: !!question.imageUrl // Flag para saber si el usuario agregó una imagen real
    }));
  };

  const handleAutoSave = useCallback(async (gameData) => {
    if (!gameData) return;
    setIsAutoSaving(true);
    setSaveError(null);
    try {
      let result;
      // Asegurar que todas las preguntas tengan una imagen (agregar imagen transparente si no hay)
      const questionsWithImages = ensureDefaultImages(gameData.questions || []);
      
      // Save layout as the selected key unless user chose a custom layout object
      const dataToSave = { 
        ...gameData, 
        questions: questionsWithImages,
        styles, 
        layout: layoutKey !== 'custom' ? layoutKey : layout, 
        images: imageUrls, 
        is_public: isPublic 
      };
      console.log('AutoSave: saving game with payload summary', {
        title: dataToSave.title,
        questionsCount: dataToSave.questions?.length,
        layout: dataToSave.layout,
        styles: dataToSave.styles,
        imagesCount: (dataToSave.images || []).length,
      });
      delete dataToSave.isPublic;

      if (gameId) {
        result = await AIGameViewModel.updateGame(gameId, dataToSave);
      } else {
        result = await AIGameViewModel.saveGame(dataToSave, true);
        if (result.success && result.gameId) {
          setGameId(result.gameId);
        }
      }

      if (!result.success) {
        setSaveError(result.message || 'Error en el autoguardado.');
      }
      else {
        // autosave successful -> clear local marker if present
        try { localStorage.removeItem('unsaved_layout'); } catch (err) {}
      }
    } catch (error) {
      setSaveError(error.message || 'Error de conexión durante el autoguardado.');
    } finally {
      setIsAutoSaving(false);
    }
  }, [gameId, styles, layout, isPublic, layoutKey, imageUrls]);

  // Save layout immediately when user selects a template to avoid losing selection before debounce
  const handleLayoutSelectImmediate = async (key) => {
    const newLayoutKey = key;
    const newLayout = LAYOUT_PRESETS[newLayoutKey] || LAYOUT_PRESETS['default'];
    setLayoutKey(newLayoutKey);
    setLayout(newLayout);

    // Persist the selection locally immediately so navigation won't lose it
    try {
      localStorage.setItem('unsaved_layout', JSON.stringify({ key: newLayoutKey, updatedAt: Date.now() }));
    } catch (err) {
      console.warn('Could not write unsaved_layout to localStorage', err);
    }

    // Also update in-memory generatedGame so autosave payload includes the selection
    if (generatedGame) {
      setGeneratedGame(prev => ({ ...(prev || {}), layout: newLayoutKey !== 'custom' ? newLayoutKey : newLayout }));
    }

    if (!generatedGame) return;

    // Asegurar que todas las preguntas tengan una imagen (agregar imagen transparente si no hay)
    const questionsWithImages = ensureDefaultImages(generatedGame.questions || []);
    
    const payload = { 
      ...generatedGame, 
      questions: questionsWithImages,
      styles, 
      layout: newLayoutKey !== 'custom' ? newLayoutKey : newLayout, 
      images: imageUrls, 
      is_public: isPublic 
    };
    try {
      let res;
      if (gameId) {
        res = await AIGameViewModel.updateGame(gameId, payload);
      } else {
        res = await AIGameViewModel.saveGame(payload, true);
        if (res.success && res.gameId) setGameId(res.gameId);
      }
      if (!res.success) {
        console.error('Failed to save layout selection immediately:', res.message || res);
      } else {
        console.log('Layout selection saved immediately:', newLayoutKey);
        // clear localStorage marker since it was persisted to backend
        try { localStorage.removeItem('unsaved_layout'); } catch (err) {}
      }
    } catch (err) {
      console.error('Error saving layout selection immediately:', err);
    }
  };

  useEffect(() => {
    if (generatedGame) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        handleAutoSave(generatedGame);
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
    }, [generatedGame, styles, layout, handleAutoSave, layoutKey, imageUrls]);

  const screenStyle = {
    '--container-bg': styles.containerBg,
    '--question-text-color': styles.questionText,
    '--answer-bg': styles.answerBg,
    '--answer-text-color': styles.answerTextColor,
  };

  const handleSetQuestionImage = (questionIndex, imageUrl) => {
    if (!generatedGame) return;

    const updatedQuestions = [...generatedGame.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      imageUrl: imageUrl,
    };

    setGeneratedGame({
      ...generatedGame,
      questions: updatedQuestions,
    });
  };

  const handleUploadComplete = (uploadResult) => {
    // Si es un refresh de imágenes
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
    if (!generatedGame) return;
    setGeneratedGame({
        ...generatedGame,
        title: newTitle,
    });
  };

  return (
    <div className="flex h-screen bg-white" style={screenStyle}>
  <NewSidebar onImagesLoaded={setImageUrls} />
      <div className="flex-1 flex flex-col">
        <MainContent 
          game={generatedGame} 
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
        {generatedGame ? (
          <StyleControlPanel styles={styles} setStyles={setStyles} setLayout={setLayout} />
        ) : (
          <AIRequirementsForm setGeneratedGame={setGeneratedGame} />
        )}
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        gameId={generatedGame?.id}
        gameTitle={generatedGame?.title}
      />
    </div>
  );
};

export default CreateGameAIScreen;