// API Configuration
import { API_URL } from '@env';

// Use environment variable or fallback to Vercel deployment
export const API_BASE_URL = API_URL || 'https://transearly-api.vercel.app';

export default {
  API_BASE_URL,
};
