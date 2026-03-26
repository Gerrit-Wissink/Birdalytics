import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
});

// Add request interceptor to handle FormData
apiClient.interceptors.request.use((config) => {
  // For FormData, delete Content-Type header so axios sets it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export default apiClient;