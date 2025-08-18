import axios from "axios";

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, ""),
});

// Detecta si la ruta es pública (/api/public/**) para NO adjuntar Authorization
function isPublicPath(urlLike) {
  try {
    const u = new URL(urlLike, api.defaults.baseURL);
    return u.pathname.startsWith("/api/public/");
  } catch {
    return false;
  }
}

// 👉 Agrega el token automáticamente, salvo en rutas públicas
api.interceptors.request.use((config) => {
  if (!isPublicPath(config.url || "")) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    // En rutas públicas evitamos credenciales para reducir preflight
    config.withCredentials = false;
  }
  return config;
});

// ❌ Captura errores por token vencido
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.data?.message === "jwt expired") {
      console.warn("🔴 Token expirado. Cerrando sesión...");
      localStorage.removeItem("token");
      localStorage.setItem("sessionExpired", "true");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
