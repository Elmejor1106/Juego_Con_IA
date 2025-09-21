import React, { useState, useEffect } from 'react';
import { Color } from "fabric";

// Función helper para asegurar que el color siempre tenga el formato #RRGGBB
const normalizeColor = (color) => {
  if (!color) return '#000000';
  try {
    // Usa la utilidad de Color de Fabric para parsear cualquier formato y convertirlo a Hex
    return new Color(color).toHex();
  } catch {
    return '#000000'; // Devuelve un color por defecto si falla
  }
};

const EditorToolbar = ({ selectedObject, onAction, onSave, isSaving }) => {
  const [fillColor, setFillColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState('Arial');

  useEffect(() => {
    if (selectedObject) {
      // Normaliza el color ANTES de guardarlo en el estado
      setFillColor(normalizeColor(selectedObject.get('fill')));
      setFontSize(selectedObject.get('fontSize') || 20);
      setFontFamily(selectedObject.get('fontFamily') || 'Arial');
    } else {
        // Resetea a valores por defecto si no hay nada seleccionado
        setFillColor('#000000');
        setFontSize(20);
        setFontFamily('Arial');
    }
  }, [selectedObject]);

  const handleAction = (action, value) => {
    if (selectedObject) {
      onAction(action, value);
    }
  };

  return (
    <div className="w-full h-16 bg-slate-100 border-b border-slate-300 flex items-center px-4 space-x-4">
      <div className="flex items-center space-x-2">
        <label htmlFor="fillColor" className="text-sm font-medium text-slate-600">Color:</label>
        <input
          type="color"
          id="fillColor"
          value={fillColor} // Ahora el estado siempre es válido
          onChange={(e) => {
            setFillColor(e.target.value);
            handleAction('fill', e.target.value);
          }}
          className="w-8 h-8 p-0 border-none rounded-md cursor-pointer disabled:opacity-50"
          disabled={!selectedObject}
        />
      </div>
      <div className="flex items-center space-x-2">
        <label htmlFor="fontSize" className="text-sm font-medium text-slate-600">Tamaño:</label>
        <input
          type="number"
          id="fontSize"
          value={fontSize}
          onChange={(e) => {
            const newSize = parseInt(e.target.value, 10);
            setFontSize(newSize);
            handleAction('fontSize', newSize);
          }}
          className="w-20 px-2 py-1 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50"
          disabled={!selectedObject || !selectedObject.isType('textbox')}
        />
      </div>
      <div className="flex items-center space-x-2">
        <label htmlFor="fontFamily" className="text-sm font-medium text-slate-600">Fuente:</label>
        <select
          id="fontFamily"
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            handleAction('fontFamily', e.target.value);
          }}
          className="px-2 py-1 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50"
          disabled={!selectedObject || !selectedObject.isType('textbox')}
        >
          <option>Arial</option>
          <option>Verdana</option>
          <option>Georgia</option>
          <option>'Courier New'</option>
          <option>'Times New Roman'</option>
          <option>'Comic Sans MS'</option>
        </select>
      </div>
      <div className="flex-grow" />
      <button 
        onClick={onSave} 
        disabled={isSaving}
        className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 disabled:bg-green-300"
      >
        {isSaving ? 'Guardando...' : 'Guardar Juego'}
      </button>
    </div>
  );
};

export default EditorToolbar;
