import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';

const GameCard = ({ game, onEdit, onDelete }) => {
  const { id, title, description, is_public, created_at, template_name } = game;
  const navigate = useNavigate();

  const formattedDate = new Date(created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePlay = () => {
    navigate(`/play/${id}`);
  };

  return (
    <Card className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-slate-200">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-slate-800 truncate pr-2">{title}</h3>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
            is_public ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {is_public ? 'Público' : 'Privado'}
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-4">Plantilla: {template_name}</p>
        <p className="text-slate-600 text-sm flex-grow">{description || 'Este juego no tiene descripción.'}</p>
      </div>
      <div className="bg-slate-50 p-4 flex justify-between items-center rounded-b-lg border-t">
        <p className="text-xs text-slate-500">
          Creado: {formattedDate}
        </p>
  <div className="flex flex-wrap gap-2">
          {onEdit && (
            <Button onClick={() => onEdit(id)} className="bg-sky-500 hover:bg-sky-600 text-white text-sm py-1.5 px-3 shadow-sm hover:shadow-md">
              Editar
            </Button>
          )}
          {onDelete && (
            <Button onClick={() => onDelete(id)} className="bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 px-3 shadow-sm hover:shadow-md">
              Eliminar
            </Button>
          )}
          <Button onClick={handlePlay} className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm py-1.5 px-3 shadow-sm hover:shadow-md">
            Jugar
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GameCard;
