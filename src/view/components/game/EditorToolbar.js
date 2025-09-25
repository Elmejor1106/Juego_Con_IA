import React from 'react';
import Button from '../common/Button';

const EditorToolbar = ({ onAddSlide, onSaveGame }) => {
  return (
    <div className="bg-gray-100 p-2 flex items-center justify-between shadow-md">
      <div>
        <span className="font-bold text-lg">Editor</span>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onAddSlide}>Añadir Diapositiva</Button>
        <Button onClick={onSaveGame} className="bg-green-500 hover:bg-green-600">
          Guardar Juego
        </Button>
      </div>
    </div>
  );
};

export default EditorToolbar;
