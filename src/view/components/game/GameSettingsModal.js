import React from 'react';
import { X, Users, Clock, Eye, Settings } from 'lucide-react';

const GameSettingsModal = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange, 
  onSave,
  isHost = false 
}) => {
  if (!isOpen) return null;

  const handleSettingChange = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings size={24} />
              <h2 className="text-xl font-bold">Configuraciones del Juego</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>
          {!isHost && (
            <p className="text-indigo-100 text-sm mt-2">
              Solo el host puede cambiar estas configuraciones
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          
          {/* Número máximo de jugadores */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Users className="text-indigo-500" size={20} />
              <label className="text-sm font-semibold text-gray-700">
                Máximo de Jugadores
              </label>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => isHost && handleSettingChange('maxPlayers', num)}
                  disabled={!isHost}
                  className={`
                    py-2 px-3 rounded-lg text-sm font-medium transition-all
                    ${settings.maxPlayers === num
                      ? 'bg-indigo-500 text-white shadow-md' 
                      : isHost 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Tiempo por pregunta */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="text-green-500" size={20} />
              <label className="text-sm font-semibold text-gray-700">
                Tiempo por Pregunta
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 15, label: '15 segundos' },
                { value: 30, label: '30 segundos' },
                { value: 60, label: '1 minuto' },
                { value: 0, label: 'Ilimitado' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => isHost && handleSettingChange('timePerQuestion', option.value)}
                  disabled={!isHost}
                  className={`
                    py-3 px-4 rounded-lg text-sm font-medium transition-all
                    ${settings.timePerQuestion === option.value
                      ? 'bg-green-500 text-white shadow-md' 
                      : isHost 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mostrar respuestas correctas */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Eye className="text-yellow-500" size={20} />
              <label className="text-sm font-semibold text-gray-700">
                Mostrar Respuestas Correctas
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => isHost && handleSettingChange('showCorrectAnswers', true)}
                disabled={!isHost}
                className={`
                  py-3 px-4 rounded-lg text-sm font-medium transition-all
                  ${settings.showCorrectAnswers
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : isHost 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                ✅ Mostrar
              </button>
              <button
                onClick={() => isHost && handleSettingChange('showCorrectAnswers', false)}
                disabled={!isHost}
                className={`
                  py-3 px-4 rounded-lg text-sm font-medium transition-all
                  ${!settings.showCorrectAnswers
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : isHost 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                ❌ Ocultar
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {settings.showCorrectAnswers 
                ? 'Los jugadores verán la respuesta correcta después de responder' 
                : 'Los jugadores solo verán si su respuesta fue correcta o incorrecta'
              }
            </p>
          </div>

          {/* Información actual */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 Configuración Actual:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• {settings.maxPlayers} jugadores máximo</div>
              <div>• {settings.timePerQuestion === 0 ? 'Sin límite de tiempo' : `${settings.timePerQuestion} segundos por pregunta`}</div>
              <div>• {settings.showCorrectAnswers ? 'Mostrar respuestas correctas' : 'Solo mostrar acierto/error'}</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        {isHost && (
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex space-x-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSettingsModal;