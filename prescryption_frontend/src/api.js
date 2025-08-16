const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const res = await fetch(url, options);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error ${res.status}: ${errText}`);
  }

  return res.json();
};

export { API_BASE_URL };
