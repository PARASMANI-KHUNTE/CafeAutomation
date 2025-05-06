// Configuration file for environment variables

// Default values for development
const defaultConfig = {
  BACKEND_URL: 'http://localhost:8000',
  API_URL: 'http://localhost:8000/api',
};

// Get environment variables from import.meta.env (Vite) or process.env (Create React App)
const env = import.meta.env || {};

// Create config object with environment variables or fallback to defaults
const config = {
  BACKEND_URL: env.VITE_BACKEND_URL || defaultConfig.BACKEND_URL,
  API_URL: env.VITE_API_URL || defaultConfig.API_URL,
};

export default config;
