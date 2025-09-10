import React from 'react';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './view/navigation/AppNavigator';

function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

export default App;
