import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthScreen from '../screens/auth/AuthScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';

// Navegador para el flujo de autenticación.
const AuthNavigator = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthScreen />} />
      <Route path="/register" element={<AuthScreen />} />
      <Route path="/forgot-password" element={<AuthScreen />} />
      <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />
      <Route path="/verify-email/:token" element={<EmailVerificationScreen />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AuthNavigator;
