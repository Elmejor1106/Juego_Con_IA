import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import './Auth.css';

const AuthScreen = () => {
  const [activeForm, setActiveForm] = useState('login'); // Puede ser 'login', 'register', o 'forgotPassword'

  const getScreenClass = () => {
    let classes = 'auth-screen';
    if (activeForm === 'register') {
      classes += ' register-active';
    } else if (activeForm === 'forgotPassword') {
      classes += ' forgot-password-active';
    }
    return classes;
  };

  // Esta función se pasa a los componentes hijos para permitirles cambiar el formulario
  const handleSwitchForm = (formName) => {
    setActiveForm(formName);
  };

  return (
    <div className={getScreenClass()}>
      {/* Floating decorative icons */}
      <div className="floating-icons">
        <div className="floating-icon">💼</div>
        <div className="floating-icon">📊</div>
        <div className="floating-icon">⚙️</div>
        <div className="floating-icon">📝</div>
        <div className="floating-icon">�</div>
        <div className="floating-icon">💡</div>
        <div className="floating-icon">📱</div>
        <div className="floating-icon">🔧</div>
      </div>
      
      <div className="auth-container">
        <div className="form-container">
          {/* 
            Todos los formularios están siempre en el DOM.
            El CSS se encarga de mostrar solo el activo.
            Esto es necesario para que las transiciones de opacidad funcionen.
          */}
          <div className="login-form">
            <LoginScreen showForm={handleSwitchForm} />
          </div>
          <div className="register-form">
            <RegisterScreen showForm={handleSwitchForm} />
          </div>
          <div className="forgot-password-form">
            <ForgotPasswordScreen showForm={handleSwitchForm} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
