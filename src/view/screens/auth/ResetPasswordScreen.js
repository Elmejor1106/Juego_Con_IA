import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthViewModel from '../../../viewModel/auth/AuthViewModel';
import './Auth.css';

const ResetPasswordScreen = () => {
  const { token } = useParams(); // Obtener el token de la URL
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!newPassword) {
      setError('La contraseña no puede estar vacía.');
      return;
    }

    setError(null);
    setMessage(null);

    const result = await AuthViewModel.resetPassword(token, newPassword);

    if (result.success) {
      setMessage(result.message + ' Serás redirigido al login.');
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Redirigir después de 3 segundos
    } else {
      setError(result.error || 'Ocurrió un error al resetear la contraseña.');
    }
  };

  return (
    <div className="auth-container">
      <div className="login-container"> {/* Reutilizamos estilos */}
        <h1>Establecer Nueva Contraseña</h1>
        
        <form onSubmit={handleResetPassword}>
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
          
          <input
            type="password"
            placeholder="Nueva Contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmar Nueva Contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={!!message}> {/* Deshabilitar botón si hay mensaje de éxito */}
            Resetear Contraseña
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
