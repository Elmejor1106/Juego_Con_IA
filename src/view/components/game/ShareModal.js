import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from '../common/Button';
import { Copy, Share2, X, Check, Eye, Edit3 } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, gameId, gameTitle }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('view');

  useEffect(() => {
    if (isOpen && gameId) {
      // Reset states when modal opens
      setShareUrl('');
      setError('');
      setCopied(false);
      setPermissionLevel('view');
    }
  }, [isOpen, gameId]);

  const generateShareLink = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5003/api/games/${gameId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissionLevel })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Error al generar enlace');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      
    } catch (err) {
      console.error('Error generando enlace:', err);
      setError(err.message || 'Error al generar el enlace de compartir');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando al portapapeles:', err);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Compartir Juego</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Game Title */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Compartiendo:</p>
          <p className="font-semibold text-gray-800 truncate">{gameTitle}</p>
        </div>

        {/* Permission Selection */}
        {!shareUrl && !loading && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de acceso:
            </label>
            <div className="space-y-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  permissionLevel === 'view' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPermissionLevel('view')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      value="view"
                      checked={permissionLevel === 'view'}
                      onChange={(e) => setPermissionLevel(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye size={18} className="text-blue-600" />
                      <span className="font-medium text-gray-800">Solo ver</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      El usuario puede ver el juego pero no modificarlo
                    </p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  permissionLevel === 'edit' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPermissionLevel('edit')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      value="edit"
                      checked={permissionLevel === 'edit'}
                      onChange={(e) => setPermissionLevel(e.target.value)}
                      className="w-4 h-4 text-green-600"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Edit3 size={18} className="text-green-600" />
                      <span className="font-medium text-gray-800">Ver y editar</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      El usuario puede ver y modificar el juego. Se agrega a "Mis Juegos"
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Button
                onClick={generateShareLink}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
              >
                Generar enlace de compartir
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <p className="text-gray-600 mt-2">Generando enlace...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Share URL */}
        {shareUrl && !loading && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlace para compartir ({permissionLevel === 'view' ? 'Solo ver' : 'Ver y editar'})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                />
                <Button
                  onClick={copyToClipboard}
                  className={`px-3 py-2 ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
              {copied && (
                <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                  <Check size={14} />
                  ¡Enlace copiado al portapapeles!
                </p>
              )}
            </div>

            {/* Info */}
            <div className={`border rounded-lg p-3 mb-4 ${
              permissionLevel === 'view' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <h4 className={`font-medium mb-1 ${
                permissionLevel === 'view' ? 'text-blue-800' : 'text-green-800'
              }`}>
                Información del enlace:
              </h4>
              <ul className={`text-sm space-y-1 ${
                permissionLevel === 'view' ? 'text-blue-700' : 'text-green-700'
              }`}>
                {permissionLevel === 'view' ? (
                  <>
                    <li>• Solo permite ver el juego</li>
                    <li>• Requiere que el usuario esté logueado</li>
                    <li>• No se agrega a "Mis Juegos" del invitado</li>
                  </>
                ) : (
                  <>
                    <li>• Permite ver y editar el juego</li>
                    <li>• Se agrega a "Mis Juegos" como colaboración</li>
                    <li>• El usuario puede modificar preguntas y estilos</li>
                    <li>• Requiere que el usuario esté logueado</li>
                  </>
                )}
              </ul>
            </div>

            {/* Generate new link button */}
            <div className="mb-4">
              <Button
                onClick={() => {
                  setShareUrl('');
                  setCopied(false);
                  setError('');
                }}
                className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white"
              >
                Generar nuevo enlace
              </Button>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default ShareModal;