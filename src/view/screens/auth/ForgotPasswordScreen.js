import React, { useState } from 'react';
import './Auth.css';
import './ForgotPasswordScreen.css';
import AuthViewModel from '../../../viewModel/auth/AuthViewModel';

const ForgotPasswordScreen = ({ showForm }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    const result = await AuthViewModel.requestPasswordReset(email);

    if (result.success) {
      setMessage(result.message);
    } else {
      setError(result.error || 'Error al enviar el correo de restablecimiento. Inténtalo de nuevo.');
    }
  };

  return (
    <>
      <h2>Restablecer Contraseña</h2>
      <p className="instructions" style={{ textAlign: 'center', marginBottom: '20px', color: 'inherit' }}>
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <form onSubmit={handleRequestReset}>
        {error && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        {message && <p className="success-message" style={{ color: 'green', textAlign: 'center' }}>{message}</p>}
        <div className="input-group">
          <input
            type="email"
            id="forgot-password-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="forgot-password-email">Correo Electrónico</label>
        </div>
        <button type="submit">Enviar Correo de Restablecimiento</button>
      </form>

      <p>
        <a onClick={() => showForm('login')}>Volver al Inicio de Sesión</a>
      </p>
    </>
  );
};

export default ForgotPasswordScreen;
