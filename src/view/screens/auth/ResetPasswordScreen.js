import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthViewModel from '../../../viewModel/auth/AuthViewModel';
import './Auth.css';
import './ResetPasswordScreen.css';

const ResetPasswordScreen = () => {
  const { token } = useParams(); // Obtener el token de la URL
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para evaluar la fortaleza de la contraseña
  const evaluatePasswordStrength = (password) => {
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (criteriaCount >= 3 && password.length >= 8) return 'strong';
    if (criteriaCount >= 2) return 'medium';
    return 'weak';
  };

  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(evaluatePasswordStrength(newPassword));
    } else {
      setPasswordStrength('');
    }
  }, [newPassword]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const result = await AuthViewModel.resetPassword(token, newPassword);

      if (result.success) {
        setMessage(result.message + ' Serás redirigido al login en 3 segundos.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.error || 'Ocurrió un error al resetear la contraseña.');
      }
    } catch (error) {
      setError('Error inesperado. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'weak': return 'Contraseña débil';
      case 'medium': return 'Contraseña moderada';
      case 'strong': return 'Contraseña fuerte';
      default: return '';
    }
  };

  return (
    <div className="reset-password-screen">
      <div className="reset-password-container">
        <h1 className="reset-password-title">Nueva Contraseña</h1>
        <p className="reset-password-subtitle">
          Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar.
        </p>
        
        <form className="reset-password-form" onSubmit={handleResetPassword}>
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          
          <div className="password-input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nueva Contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isSubmitting || !!message}
            />
            <span 
              className="input-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>

          {newPassword && (
            <div className="password-strength-indicator">
              <div className="strength-bar">
                <div className={`strength-fill ${passwordStrength}`}></div>
              </div>
              <div className={`strength-text ${passwordStrength}`}>
                {getPasswordStrengthText()}
              </div>
            </div>
          )}
          
          <div className="password-input-group">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar Nueva Contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting || !!message}
            />
            <span 
              className="input-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </span>
          </div>

          <div className="security-tips">
            <h4>💡 Consejos para una contraseña segura:</h4>
            <ul>
              <li>Al menos 8 caracteres de longitud</li>
              <li>Combina mayúsculas y minúsculas</li>
              <li>Incluye números y símbolos especiales</li>
              <li>Evita información personal obvía</li>
            </ul>
          </div>
          
          <button 
            type="submit" 
            className="reset-password-button"
            disabled={isSubmitting || !!message}
          >
            {isSubmitting ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>

        {message && (
          <div className="success-redirect">
            <p>¡Contraseña actualizada exitosamente!</p>
            <p>Redirigiendo al inicio de sesión...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
