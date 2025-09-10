import React, { useState } from 'react';
import './Auth.css';
import './RegisterScreen.css';
import AuthViewModel from '../../../viewModel/auth/AuthViewModel';

const RegisterScreen = ({ showForm }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username || !email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    try {
      await AuthViewModel.register(
        username,
        email,
        password,
        (successMessage) => {
          setSuccess(successMessage + ' Por favor, inicia sesión.');
          // After a delay, switch to the login form
          setTimeout(() => {
            showForm('login');
          }, 2000);
        },
        (errorMessage) => {
          setError(errorMessage);
        }
      );
    } catch (error) {
      setError("Error inesperado: " + error.message);
    }
  };

  return (
    <>
      <h2>Crear Cuenta</h2>
      {error && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {success && <p className="success-message" style={{ color: 'green', textAlign: 'center' }}>{success}</p>}
      <form onSubmit={handleRegister}>
        <div className="input-group">
          <input
            type="text"
            id="register-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <label htmlFor="register-username">Nombre de usuario</label>
        </div>
        <div className="input-group">
          <input
            type="email"
            id="register-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="register-email">Correo electrónico</label>
        </div>
        <div className="input-group">
          <input
            type="password"
            id="register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="register-password">Contraseña</label>
        </div>
        <button type="submit">Registrarse</button>
      </form>
      <p>
        ¿Ya tienes cuenta?{' '}
        <a onClick={() => showForm('login')}>Inicia sesión</a>
      </p>
    </>
  );
};

export default RegisterScreen;
