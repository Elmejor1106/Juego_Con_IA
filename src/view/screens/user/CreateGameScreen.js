import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const CreateGameScreen = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      const result = await GameViewModel.getTemplates();
      if (result.success) {
        setTemplates(result.templates);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    };
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (templateId) => {
    navigate(`/create-game-editor/${templateId}`);
  };

  if (isLoading) {
    return <div className="text-center p-10 text-slate-500">Cargando plantillas...</div>;
  }

  if (error) {
    return <div className="text-red-600 bg-red-100 p-4 rounded-lg border border-red-200">{error}</div>;
  }

  return (
    <div className="fade-in">
      {/* Encabezado de la Página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Crear un Nuevo Juego</h1>
        <p className="text-slate-500 mt-1">
          Elige una de nuestras plantillas prediseñadas para empezar en segundos.
        </p>
      </div>

      {/* Grid de Plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-slate-200">
            <div className="p-6 flex-grow flex flex-col text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-2">{template.name}</h2>
              <p className="text-slate-600 text-sm mb-6 flex-grow">{template.description}</p>
              <Button 
                onClick={() => handleSelectTemplate(template.id)}
                className="bg-sky-500 hover:bg-sky-600 mt-auto text-white shadow-md hover:shadow-lg"
              >
                Usar esta plantilla
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CreateGameScreen;
