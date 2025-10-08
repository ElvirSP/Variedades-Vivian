import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const API_BASE_URL = `${API_URL}/api`;

// Función para limpiar datos de autenticación
const clearAuthData = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

// Función para renovar token
const renovarToken = async () => {
  try {
    const response = await api.post('/auth/renovar-token');
    if (response.data.success) {
      const { token } = response.data.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al renovar token:', error);
    return false;
  }
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorData = error.response.data;
      
      // Limpiar datos de autenticación
      clearAuthData();
      
      // Mostrar mensaje específico según el tipo de error
      if (errorData?.code === 'TOKEN_EXPIRED') {
        console.warn('Token expirado. Redirigiendo al login...');
        // Opcional: mostrar notificación al usuario
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (errorData?.code === 'TOKEN_INVALID') {
        console.warn('Token inválido. Redirigiendo al login...');
        alert('Sesión inválida. Por favor, inicia sesión nuevamente.');
      }
      
      // Redirigir al login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
export { clearAuthData, renovarToken };