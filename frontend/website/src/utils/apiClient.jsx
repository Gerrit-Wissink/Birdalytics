import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

// Add request interceptor to handle FormData
apiClient.interceptors.request.use((config) => {
  // Only set Content-Type to JSON if data is not FormData
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  // For FormData, axios will automatically set the correct Content-Type with boundary
  return config;
});

export default apiClient;