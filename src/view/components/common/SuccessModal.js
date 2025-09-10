import React, { useEffect } from 'react';
import ReactDOM from 'react-dom'; // Importar ReactDOM
import './SuccessModal.css';

const SuccessModal = ({ message, onDone }) => {
  useEffect(() => {
    // console.log('SuccessModal: Mensaje recibido:', message); // Línea de depuración
    const timer = setTimeout(() => {
      onDone(); // Llamar a onDone en lugar de onClose
    }, 2000); // Cerrar automáticamente y navegar después de 2 segundos

    return () => clearTimeout(timer);
  }, [onDone, message]);

  return ReactDOM.createPortal(
    <div className="modal-overlay"> {/* Fondo prominente para depuración */} 
      <div className="modal-content">
        <h2>Éxito</h2>
        <p>{message}</p>
        {/* Se eliminó el botón de cierre manual ya que la navegación ahora es automática */}
      </div>
    </div>,
    document.getElementById('modal-root') // Renderizar en el div modal-root
  );
};

export default SuccessModal;
