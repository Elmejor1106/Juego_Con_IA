
import axios from 'axios';

// Crea una instancia de axios pre-configurada
const apiClient = axios.create({
  // La URL base de tu API de backend
  // Asegúrate de que tu servidor backend esté corriendo en el puerto 5000
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token JWT a cada petición
apiClient.interceptors.request.use(
  (config) => {
    // Recupera el token del localStorage (o de donde lo guardes)
    const token = localStorage.getItem('token');
    if (token) {
      // Si el token existe, lo añade a la cabecera de autorización
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Maneja errores en la configuración de la petición
    return Promise.reject(error);
  }
);

export default apiClient;
