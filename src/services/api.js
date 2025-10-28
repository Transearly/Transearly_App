import axios from 'axios';
import io from 'socket.io-client';
import { API_BASE_URL, WS_BASE_URL, API_ENDPOINTS, WS_EVENTS } from '../config/api.config';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Polyfill for WebSocket in React Native environment
if (typeof WebSocket !== 'undefined') {
  global.WebSocket = WebSocket;
}

class TranslationAPI {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
    this.socket = null;
    this.socketId = null;
  }

  /**
   * Initialize WebSocket connection
   * @returns {Promise<string>} Socket ID for connection
   */
  initializeWebSocket() {
    if (this.socket && this.socketId) {
      console.log('WebSocket already connected with ID:', this.socketId);
      return this.socketId;
    }

    console.log('Initializing WebSocket connection to:', WS_BASE_URL);

    return new Promise((resolve, reject) => {
      // Check network connectivity
      NetInfo.fetch().then(networkState => {
        console.log('Network state:', networkState);
        
        if (networkState.isConnected) {
          // Try WebSocket connection if network is available
          try {
            this.socket = io(WS_BASE_URL, {
              timeout: 5000,
              forceNew: true,
              transports: Platform.OS === 'web' ? ['websocket'] : ['websocket', 'polling'],
            });

            this.socket.on('connect', () => {
              this.socketId = this.socket.id;
              console.log('WebSocket connected with ID:', this.socketId);
              resolve(this.socketId);
            });

            this.socket.on('connect_error', (error) => {
              console.error('WebSocket connection error:', error);
              reject(error);
            });

            this.socket.on('disconnect', (reason) => {
              console.log('WebSocket disconnected:', reason);
              this.socket = null;
              this.socketId = null;
            });
          } catch (error) {
            console.error('WebSocket initialization failed:', error);
          }
        } else {
          // Use fallback ID if no network
          console.log('No network connection, using fallback ID');
          this.socketId = 'fallback-' + Date.now();
          resolve(this.socketId);
        }
      });
    });
  }

  /**
   * Add translation status listeners
   * @param {Function} onComplete - Callback for translation complete
   * @param {Function} onFailed - Callback for translation failed
   */
  addTranslationListeners(onComplete, onFailed) {
    if (!this.socket) {
      console.log('WebSocket not initialized, but proceeding with listeners setup');
      return;
    }

    console.log('Adding translation listeners for events:', WS_EVENTS);

    // Store listeners so we can remove them later
    this.onComplete = onComplete;
    this.onFailed = onFailed;

    this.socket.on(WS_EVENTS.TRANSLATION_COMPLETE, (data) => {
      console.log('Translation complete event received:', data);
      if (this.onComplete) this.onComplete(data);
    });
    
    this.socket.on(WS_EVENTS.TRANSLATION_FAILED, (error) => {
      console.log('Translation failed event received:', error);
      if (this.onFailed) this.onFailed(error);
    });
  }

  /**
   * Remove translation status listeners
   */
  removeTranslationListeners() {
    if (this.socket) {
      console.log('Removing translation listeners');
      this.socket.off(WS_EVENTS.TRANSLATION_COMPLETE);
      this.socket.off(WS_EVENTS.TRANSLATION_FAILED);
      
      // Clear stored listeners
      this.onComplete = null;
      this.onFailed = null;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.socketId = null;
    }
  }

  /**
   * Upload a file for translation
   * @param {Object} file - File object to upload
   * @param {string} targetLanguage - Target language for translation
   * @param {boolean} isUserPremium - Whether the user is premium
   * @returns {Promise<Object>} Upload result with jobId
   */
  async uploadFileForTranslation(file, targetLanguage = 'English', isUserPremium = false) {
    try {
      // Check if we have a socketId (either from WebSocket or fallback)
      if (!this.socketId) {
        console.log('No socketId available, generating fallback');
        this.socketId = 'fallback-' + Date.now();
      }

      // Create a proper file object for React Native
      const fileObj = {
        uri: file.uri,
        type: file.type,
        name: file.name,
        size: file.size,
      };

      const formData = new FormData();
      formData.append('file', fileObj);
      formData.append('targetLanguage', targetLanguage);
      formData.append('isUserPremium', isUserPremium.toString());
      formData.append('socketId', this.socketId);

      console.log('Preparing file upload with socketId:', this.socketId);
      console.log('File object for FormData:', fileObj);

      const response = await this.api.post(API_ENDPOINTS.UPLOAD_FILE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout for upload
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('File Upload API error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      throw this.handleError(error);
    }
  }

  /**
   * Download a translated file
   * @param {string} fileName - Name of the file to download
   * @returns {Promise<Blob>} File blob
   */
  async downloadTranslatedFile(fileName) {
    try {
      console.log('Downloading file:', fileName);
      const downloadUrl = API_ENDPOINTS.DOWNLOAD_FILE(fileName);
      console.log('Download URL:', API_BASE_URL + downloadUrl);
      
      const response = await this.api.get(downloadUrl, {
        responseType: 'blob',
      });
      
      console.log('Download response received, blob size:', response.data.size);
      return response.data;
    } catch (error) {
      console.error('File Download API error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || error.response.data?.error || 'Server error';
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  /**
   * Translate text from one language to another using OpenAI API
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @returns {Promise<Object>} Translation result
   */
  async translateText(text, fromLang = 'auto', toLang = 'en') {
    try {
      const response = await this.api.post(API_ENDPOINTS.TRANSLATE_TEXT, {
        text,
        sourceLanguage: fromLang,
        targetLanguage: toLang
      });

      if (!response.data) {
        throw new Error('No response data received');
      }

      return {
        translatedText: response.data.translatedText,
        sourceLang: fromLang,
        targetLang: toLang
      };
    } catch (error) {
      console.error('Text Translation API error:', error);
      throw this.handleError(error);
    }
  }
}

// Create and export a singleton instance
const translationAPI = new TranslationAPI();
export default translationAPI;