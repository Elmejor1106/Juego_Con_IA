import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ImageService from '../../../model/business_logic/services/ImageService';
import UserService from '../../../model/business_logic/services/UserService';
import apiClient from '../../../model/data/api/apiClient';
import Button from './Button';

const ImageSelectorModal = ({ isOpen, onClose, onImageSelected }) => {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUserImages();
    }
  }, [isOpen]);

  const loadUserImages = async () => {
    try {
      setLoading(true);
      setError('');
      const userImages = await ImageService.getMyImages();
      setImages(userImages || []);
    } catch (error) {
      setError('Error al cargar las imágenes: ' + error.message);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. El tamaño máximo es 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;
      
      // Recargar la lista de imágenes
      await loadUserImages();
      
      // Seleccionar automáticamente la imagen recién subida
      if (result.imageUrl) {
        setSelectedImage(result.imageUrl);
      }

    } catch (error) {
      setError('Error al subir la imagen: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirmSelection = async () => {
    if (!selectedImage) {
      setError('Por favor selecciona una imagen');
      return;
    }

    try {
      setLoading(true);
      
      // Actualizar el avatar_url en el perfil del usuario
      await UserService.updateUserProfile(user.id, {
        avatar_url: selectedImage
      });

      // Notificar al componente padre sobre la imagen seleccionada
      onImageSelected(selectedImage);
      
      // Cerrar el modal
      onClose();
      
    } catch (error) {
      setError('Error al actualizar la imagen de perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setLoading(true);
      
      // Remover el avatar_url del perfil del usuario
      await UserService.updateUserProfile(user.id, {
        avatar_url: null
      });

      // Notificar al componente padre
      onImageSelected(null);
      
      // Cerrar el modal
      onClose();
      
    } catch (error) {
      setError('Error al remover la imagen de perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Seleccionar Imagen de Perfil</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Botón de subir imagen */}
          <div className="mb-6">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 cursor-pointer transition-colors">
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <span className="text-gray-600">Subiendo imagen...</span>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-gray-600">
                      <span className="font-medium text-indigo-600">Haz clic para subir</span> una nueva imagen
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 5MB</p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Lista de imágenes existentes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Tus imágenes</h3>
            
            {loading && !uploading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Cargando imágenes...</span>
              </div>
            )}

            {images.length === 0 && !loading ? (
              <p className="text-gray-500 text-center py-8">No tienes imágenes subidas aún</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === image.image_url
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                    onClick={() => handleImageSelect(image.image_url)}
                  >
                    <img
                      src={`http://localhost:5003${image.image_url}`}
                      alt={image.filename || 'Imagen'}
                      className="w-full h-20 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-20 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">Error al cargar</span>
                    </div>
                    
                    {selectedImage === image.image_url && (
                      <div className="absolute inset-0 bg-indigo-500 bg-opacity-20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleRemoveAvatar}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              disabled={loading}
            >
              Quitar Avatar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSelection}
              disabled={!selectedImage || loading}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white disabled:opacity-50"
            >
              {loading ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSelectorModal;