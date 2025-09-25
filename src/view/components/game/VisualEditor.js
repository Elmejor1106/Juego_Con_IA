import React, { useState, useEffect } from 'react';

const VisualEditor = ({ slide, onUpdate }) => {
  const [elements, setElements] = useState(slide ? slide.elements : []);

  useEffect(() => {
    setElements(slide ? slide.elements : []);
  }, [slide]);

  const handleDrop = (e) => {
    e.preventDefault();
    const assetType = e.dataTransfer.getData("assetType");
    const newElement = {
      id: Date.now(), // simple unique id
      type: assetType,
      content: assetType === 'text' ? 'Texto de ejemplo' : 'URL_de_imagen',
      style: { position: 'absolute', left: e.clientX, top: e.clientY },
    };
    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    onUpdate(updatedElements);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div 
      className="w-1/2 flex-grow bg-white border-l border-r relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {elements.map(el => (
        <div key={el.id} style={el.style} className="p-2 border border-dashed">
          {el.type === 'text' ? (
            <p>{el.content}</p>
          ) : (
            <img src={el.content} alt="asset" width="100" />
          )}
        </div>
      ))}
      {!slide && <div className="text-center p-10 text-gray-500">Selecciona o crea una diapositiva para comenzar</div>}
    </div>
  );
};

export default VisualEditor;
