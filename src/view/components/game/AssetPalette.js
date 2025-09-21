import React from 'react';

// --- SVG Assets ---
const personSvg = `<svg viewBox="0 0 24 24" fill="black"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
const starSvg = `<svg viewBox="0 0 24 24" fill="black"><path d="M12 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L12 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>`;
const arrowSvg = `<svg viewBox="0 0 24 24" fill="black"><path d="M22 12l-4-4v3H3v2h15v3z"/></svg>`;

const AssetButton = ({ label, onClick, children }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
  >
    {children}
    <span className="ml-3">{label}</span>
  </button>
);

const AssetGroup = ({ title, children }) => (
    <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-2 mt-3">{title}</h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const AssetPalette = ({ onAdd }) => {

  return (
    <div className="h-full">
        <AssetGroup title="Formas Básicas">
            <AssetButton label="Texto" onClick={() => onAdd('text')}>
                <div className="w-6 h-6 text-center text-lg font-bold text-slate-600">T</div>
            </AssetButton>
            <AssetButton label="Rectángulo" onClick={() => onAdd('rect')}>
                <div className="w-6 h-6 bg-slate-600 rounded-sm" />
            </AssetButton>
            <AssetButton label="Círculo" onClick={() => onAdd('circle')}>
                <div className="w-6 h-6 bg-slate-600 rounded-full" />
            </AssetButton>
        </AssetGroup>

        <AssetGroup title="Iconos y Símbolos">
            <AssetButton label="Persona" onClick={() => onAdd('svg', personSvg)}>
                <div className="w-6 h-6" dangerouslySetInnerHTML={{ __html: personSvg }} />
            </AssetButton>
            <AssetButton label="Estrella" onClick={() => onAdd('svg', starSvg)}>
                <div className="w-6 h-6" dangerouslySetInnerHTML={{ __html: starSvg }} />
            </AssetButton>
            <AssetButton label="Flecha" onClick={() => onAdd('svg', arrowSvg)}>
                <div className="w-6 h-6" dangerouslySetInnerHTML={{ __html: arrowSvg }} />
            </AssetButton>
        </AssetGroup>
    </div>
  );
};

export default AssetPalette;
