import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Usamos axios para llamar al microservicio en otro puerto
import apiClient from '../../../model/data/api/apiClient'; // Usamos apiClient para nuestro backend principal
import { Loader, AlertTriangle, ImageIcon } from 'lucide-react';

// Caché en memoria para almacenar las sugerencias.
// Se define fuera del componente para que persista entre renders.
const suggestionsCache = new Map();

const ImageSuggestions = ({ query, onSelectImage }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingImage, setSavingImage] = useState(null); // Almacena la URL de la imagen que se está guardando

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query) {
        setSuggestions([]);
        return;
      }

      // 1. Revisar el caché primero
      if (suggestionsCache.has(query)) {
        setSuggestions(suggestionsCache.get(query));
        return; // Salir si ya tenemos los datos
      }

      setIsLoading(true);
      setError(null);
      try {
        // 2. Si no está en caché, hacer la llamada a la API
        const response = await axios.get(`http://localhost:8081/api/suggestions?title=${encodeURIComponent(query)}`);
        const newSuggestions = response.data || [];
        
        // 3. Guardar el resultado en el caché
        suggestionsCache.set(query, newSuggestions);
        setSuggestions(newSuggestions);

      } catch (err) {
        console.error("Error fetching image suggestions:", err);
        setError("No se pudieron cargar las sugerencias. El microservicio puede no estar en ejecución.");
      } finally {
        setIsLoading(false);
      }
    };

    // El debounce sigue siendo útil si el query pudiera cambiar rápidamente.
    const handler = setTimeout(() => {
      fetchSuggestions();
    }, 300); // Reducido un poco el tiempo de debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const handleSelectSuggestion = async (imageUrl) => {
    if (savingImage) return; // Evitar múltiples clics

    setSavingImage(imageUrl);
    setError(null);
    try {
      // Le pedimos a nuestro backend que descargue y guarde la imagen desde la URL de Pexels
      const response = await apiClient.post('/images/upload-from-url', { url: imageUrl });
      
      if (response.data && response.data.success) {
        // Una vez guardada, pasamos la nueva URL local al componente padre
        onSelectImage(response.data.imageUrl);
      } else {
        throw new Error(response.data.message || 'El backend no pudo guardar la imagen.');
      }
    } catch (err) {
      console.error("Error saving image from URL:", err);
      setError("No se pudo guardar la imagen seleccionada.");
    } finally {
      setSavingImage(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-500 h-24">
          <Loader className="animate-spin mb-2" size={24} />
          <p className="text-sm">Buscando sugerencias...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-red-600 bg-red-50 p-4 rounded-lg h-24">
          <AlertTriangle className="mb-2" size={24} />
          <p className="text-sm text-center">{error}</p>
        </div>
      );
    }

    if (suggestions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-500 h-24">
          <ImageIcon className="mb-2" size={24} />
          <p className="text-sm">No se encontraron sugerencias.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-2">
        {suggestions.map((url, index) => (
          <div key={index} className="relative aspect-square group cursor-pointer" onClick={() => handleSelectSuggestion(url)}>
            <img src={url} alt={`Sugerencia ${index + 1}`} className="w-full h-full object-cover rounded-md" />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
              {savingImage === url ? (
                <Loader className="animate-spin text-white" size={24} />
              ) : (
                <p className="text-white text-xs font-bold">Seleccionar</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Sugerencias de la IA</h3>
      {renderContent()}
    </div>
  );
};

export default ImageSuggestions;