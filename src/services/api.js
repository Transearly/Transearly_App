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
    // Log the API_BASE_URL being used
    console.log('[TranslationAPI] Initializing with baseURL:', API_BASE_URL);

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
            
            // Add debugging for all events
            this.socket.onAny((eventName, ...args) => {
              console.log(`[WebSocket] Received event: ${eventName}`, args);
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
   * Get MIME type based on file extension
   * @param {string} fileName - Name of the file
   * @returns {string} MIME type
   */
  getMimeType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'csv': 'text/csv',
      'txt': 'text/plain'
    };
    return mimeTypes[extension] || 'application/octet-stream';
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
   * Translate text using AI (auto-detects source language)
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language name (e.g., 'Vietnamese', 'English')
   * @returns {Promise<Object>} Translation result
   */
  async translateText(text, targetLanguage = 'English') {
    try {
      console.log('translateText - API Base URL:', API_BASE_URL);
      console.log('translateText - Endpoint:', API_ENDPOINTS.TRANSLATE_TEXT);
      console.log('translateText - Full URL:', API_BASE_URL + API_ENDPOINTS.TRANSLATE_TEXT);
      console.log('translateText - Request payload:', { text: text.substring(0, 50) + '...', targetLanguage });

      const response = await this.api.post(API_ENDPOINTS.TRANSLATE_TEXT, {
        text,
        targetLanguage
      });

      console.log('translateText - Response status:', response.status);
      console.log('translateText - Response data:', response.data);

      if (!response.data) {
        throw new Error('No response data received');
      }

      // Handle both direct response and wrapped response
      const data = response.data.data || response.data;

      return {
        translatedText: data.translatedText,
        targetLanguage: data.targetLanguage,
        success: data.success
      };
    } catch (error) {
      console.error('Text Translation API error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });
      throw this.handleError(error);
    }
  }

  /**
   * Translate image using AI (OCR + Translation)
   * @param {Object} imageFile - Image file object with uri, type, name
   * @param {string} targetLanguage - Target language name (e.g., 'Vietnamese', 'English')
   * @returns {Promise<Object>} Translation result with extracted and translated text
   */
  async translateImage(imageFile, targetLanguage = 'Vietnamese') {
    try {
      console.log('translateImage - API Base URL:', API_BASE_URL);
      console.log('translateImage - Endpoint:', API_ENDPOINTS.TRANSLATE_IMAGE);
      console.log('translateImage - Full URL:', API_BASE_URL + API_ENDPOINTS.TRANSLATE_IMAGE);
      console.log('translateImage - Request payload:', {
        fileName: imageFile.name,
        targetLanguage
      });

      // Create FormData for image upload
      const formData = new FormData();

      // Create proper file object for React Native
      const fileObj = {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'photo.jpg',
      };

      formData.append('file', fileObj);
      formData.append('targetLanguage', targetLanguage);

      const response = await this.api.post(API_ENDPOINTS.TRANSLATE_IMAGE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for image processing
      });

      console.log('translateImage - Response status:', response.status);
      console.log('translateImage - Response data:', response.data);

      if (!response.data) {
        throw new Error('No response data received');
      }

      // Handle both direct response and wrapped response
      const data = response.data.data || response.data;

      return {
        translatedText: data.translatedText,
        targetLanguage: data.targetLanguage,
        success: data.success,
        segments: data.segments || [] // Array of {original, translated, position}
      };
    } catch (error) {
      console.error('Image Translation API error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });
      throw this.handleError(error);
    }
  }

  /**
   * Translate audio using Google Speech-to-Text + AI Translation
   * @param {Object} audioFile - Audio file object with uri, type, name
   * @param {string} sourceLanguage - Source language code (e.g., 'auto', 'vi', 'en')
   * @param {string} targetLanguage - Target language name (e.g., 'Vietnamese', 'English')
   * @returns {Promise<Object>} Translation result with transcribed and translated text
   */
  async translateAudio(audioFile, sourceLanguage = 'auto', targetLanguage = 'Vietnamese') {
    try {
      console.log('translateAudio - API Base URL:', API_BASE_URL);
      console.log('translateAudio - Endpoint:', API_ENDPOINTS.TRANSLATE_AUDIO);
      console.log('translateAudio - Full URL:', API_BASE_URL + API_ENDPOINTS.TRANSLATE_AUDIO);
      console.log('translateAudio - Request payload:', {
        fileName: audioFile.name,
        fileType: audioFile.type,
        sourceLanguage,
        targetLanguage
      });

      // Create FormData for audio upload
      const formData = new FormData();

      // Create proper file object for React Native
      const fileObj = {
        uri: audioFile.uri,
        type: audioFile.type || 'audio/mpeg',
        name: audioFile.name || 'recording.mp3',
      };

      formData.append('file', fileObj);
      formData.append('sourceLanguage', sourceLanguage);
      formData.append('targetLanguage', targetLanguage);

      const response = await this.api.post(API_ENDPOINTS.TRANSLATE_AUDIO, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 90000, // 90 second timeout for audio processing (speech-to-text + translation)
      });

      console.log('translateAudio - Response status:', response.status);
      console.log('translateAudio - Response data:', response.data);

      if (!response.data) {
        throw new Error('No response data received');
      }

      // Handle both direct response and wrapped response
      const data = response.data.data || response.data;

      return {
        success: data.success,
        originalText: data.originalText,
        translatedText: data.translatedText,
        targetLanguage: targetLanguage,
        audioDetails: data.audioDetails || {}
      };
    } catch (error) {
      console.error('Audio Translation API error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });
      throw this.handleError(error);
    }
  }
}

// Create and export a singleton instance
const translationAPI = new TranslationAPI();
export default translationAPI;