// API Configuration
import { API_URL, WEBSOCKET_URL } from '@env';

// Use environment variable or fallback to deployment URLs
const baseUrl = API_URL || 'http://192.168.102.92:5010';
const wsUrl = WEBSOCKET_URL || 'ws://192.168.102.92:5010';

export const API_BASE_URL = baseUrl;
export const WS_BASE_URL = wsUrl;

export const API_ENDPOINTS = {
  UPLOAD_FILE: '/translator/upload',
  DOWNLOAD_FILE: (fileName) => `/translator/download/${fileName}`,
  TRANSLATE_TEXT: '/translator/text',
};

export const WS_EVENTS = {
  TRANSLATION_COMPLETE: 'translationComplete',
  TRANSLATION_FAILED: 'translationFailed',
};

export default {
  API_BASE_URL,
  WS_BASE_URL,
  API_ENDPOINTS,
  WS_EVENTS,
};
