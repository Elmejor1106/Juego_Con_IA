import React, { useState } from 'react';
import './Auth.css';
import './LoginScreen.css';
import { useNavigate } from 'react-router-dom';
import AuthViewModel from '../../../viewModel/auth/AuthViewModel';
import { useAuth } from '../../../context/AuthContext';

const LoginScreen = ({ showForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setError(null);
    const result = await AuthViewModel.login(email, password);

    if (result.success) {
      login(result.token);
      navigate('/home');
    } else {
      setError(result.error || 'Error en el inicio de sesión. Inténtalo de nuevo.');
    }
  };

  return (
    <>
      <h2>Iniciar Sesión</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleLogin}>
        <div className="input-group">
          <input
            type="email"
            id="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="login-email">Correo Electrónico</label>
        </div>
        <div className="input-group">
          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="login-password">Contraseña</label>
        </div>
        <button type="submit">Iniciar Sesión</button>
      </form>
      <p>
        <a onClick={() => showForm('forgotPassword')}>¿Olvidaste tu contraseña?</a>
      </p>
      <p>
        ¿No tienes cuenta?{' '}
        <a onClick={() => showForm('register')}>Regístrate</a>
      </p>
    </>
  );
};

export default LoginScreen;
