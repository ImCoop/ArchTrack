import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});
