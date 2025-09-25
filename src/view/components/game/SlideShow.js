import React from 'react';

const SlideShow = ({ slides, currentSlideIndex, onSlideChange, onDeleteSlide }) => {
  return (
    <div className="w-1/4 bg-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Diapositivas</h3>
      <div className="space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => onSlideChange(index)}
            className={`p-2 border rounded cursor-pointer ${currentSlideIndex === index ? 'border-blue-500 bg-blue-100' : 'bg-white'}`}>
            <p>Diapositiva {index + 1}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteSlide(slide.id); }}
              className="text-red-500 text-xs float-right">
                Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlideShow;
