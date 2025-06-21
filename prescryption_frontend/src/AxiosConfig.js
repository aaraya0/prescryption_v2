import axios from "axios";

const api = axios.create();

// 👉 Agrega el token automáticamente a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❌ Captura errores por token vencido
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message === "jwt expired") {
      console.warn("🔴 Token expirado. Cerrando sesión...");
      localStorage.removeItem("token");
      localStorage.setItem("sessionExpired", "true");

      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
