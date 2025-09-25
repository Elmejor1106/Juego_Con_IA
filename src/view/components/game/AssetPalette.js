import React from 'react';

const AssetPalette = () => {
  const handleDragStart = (e, assetType) => {
    e.dataTransfer.setData("assetType", assetType);
  };

  return (
    <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Activos</h3>
      <div className="space-y-2">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'text')}
          className="p-2 border rounded bg-white cursor-grab"
        >
          Texto
        </div>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'image')}
          className="p-2 border rounded bg-white cursor-grab"
        >
          Imagen
        </div>
        {/* Agrega más activos aquí */}
      </div>
    </div>
  );
};

export default AssetPalette;
