import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthViewModel from '../../../viewModel/auth/AuthViewModel';
import './EmailVerificationScreen.css';

const EmailVerificationScreen = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationState, setVerificationState] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationState('error');
        setMessage('Token de verificación no válido.');
        return;
      }

      try {
        const result = await AuthViewModel.verifyEmail(token);
        if (result.success) {
          setVerificationState('success');
          setMessage(result.message);
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/auth', { state: { showLogin: true, verificationSuccess: true } });
          }, 3000);
        } else {
          setVerificationState('error');
          setMessage(result.error);
        }
      } catch (error) {
        setVerificationState('error');
        setMessage('Error al verificar el correo electrónico.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleReturnToLogin = () => {
    navigate('/auth', { state: { showLogin: true } });
  };

  return (
    <div className="email-verification-screen">
      <div className="verification-container">
        <div className="verification-card">
          {verificationState === 'verifying' && (
            <>
              <div className="verification-icon verifying">
                <div className="spinner"></div>
              </div>
              <h2>Verificando tu correo...</h2>
              <p>Por favor, espera mientras verificamos tu correo electrónico.</p>
            </>
          )}

          {verificationState === 'success' && (
            <>
              <div className="verification-icon success">
                ✅
              </div>
              <h2>¡Correo verificado exitosamente!</h2>
              <p>{message}</p>
              <div className="redirect-info">
                <p>Serás redirigido al login en unos segundos...</p>
                <button 
                  className="btn-primary"
                  onClick={handleReturnToLogin}
                >
                  Ir al Login Ahora
                </button>
              </div>
            </>
          )}

          {verificationState === 'error' && (
            <>
              <div className="verification-icon error">
                ❌
              </div>
              <h2>Error en la verificación</h2>
              <p>{message}</p>
              <div className="error-actions">
                <button 
                  className="btn-primary"
                  onClick={handleReturnToLogin}
                >
                  Volver al Login
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate('/auth', { state: { showRegister: true } })}
                >
                  Registrarse de Nuevo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationScreen;