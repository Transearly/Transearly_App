// API Configuration
import { API_URL, WEBSOCKET_URL } from '@env';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determine the base URL based on environment
const getBaseUrl = () => {
  // If environment variable is set, use it
  if (API_URL) {
    return API_URL;
  }

  // For Android Emulator, use 10.0.2.2 to access host machine
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://192.168.1.5:5010';
  }

  // For iOS Simulator or physical devices, use local network IP
  return 'http://192.168.1.5:5010';
};

const getWsUrl = () => {
  if (WEBSOCKET_URL) {
    return WEBSOCKET_URL;
  }

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'ws://192.168.1.5:5010';
  }

  return 'ws://192.168.1.5:5010';
};

export const API_BASE_URL = getBaseUrl();
export const WS_BASE_URL = getWsUrl();

export const API_ENDPOINTS = {
  UPLOAD_FILE: '/translator/upload',
  DOWNLOAD_FILE: (fileName) => `/translator/download/${fileName}`,
  TRANSLATE_TEXT: '/translator/text',
  TRANSLATE_IMAGE: '/translator/image',
  TRANSLATE_AUDIO: '/translator/audio',
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
