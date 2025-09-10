// ViewModel: Lógica de presentación y estado para la autenticación.
import AuthService from "../../model/business_logic/services/AuthService";

const AuthViewModel = {
  login: async (email, password) => {
    try {
      const data = await AuthService.login(email, password);
      return { success: true, token: data.token };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  register: async (username, email, password, onSuccess, onError) => {
    try {
      await AuthService.register(username, email, password);
      onSuccess('Registro exitoso. Ahora puedes iniciar sesión.');
      return { success: true };
    } catch (error) {
      onError(error.message);
      return { success: false, error: error.message };
    }
  },

  // AÑADIDO: Lógica para solicitar el reseteo
  requestPasswordReset: async (email) => {
    try {
      const data = await AuthService.requestPasswordReset(email);
      return { success: true, message: data.msg };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // AÑADIDO: Lógica para ejecutar el reseteo
  resetPassword: async (token, newPassword) => {
    try {
      const data = await AuthService.resetPassword(token, newPassword);
      return { success: true, message: data.msg };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default AuthViewModel;
