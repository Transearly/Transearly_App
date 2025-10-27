import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

class TranslationAPI {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Translate text from source language to target language
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language code (e.g., 'en', 'es', 'auto')
   * @param {string} targetLang - Target language code
   * @returns {Promise<Object>} Translation result
   */
  async translateText(text, sourceLang = 'auto', targetLang) {
    try {
      const response = await this.api.post('/translate/text', {
        text,
        sourceLang,
        targetLang,
      });
      return response.data;
    } catch (error) {
      console.error('Translation API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Translate voice (audio to text to translation)
   * @param {string} audioData - Base64 encoded audio data
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {Promise<Object>} Voice translation result
   */
  async translateVoice(audioData, sourceLang = 'auto', targetLang) {
    try {
      const response = await this.api.post('/translate/voice', {
        audioData,
        sourceLang,
        targetLang,
      });
      return response.data;
    } catch (error) {
      console.error('Voice translation API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Translate image (OCR + translation)
   * @param {string} imageData - Base64 encoded image data
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {Promise<Object>} Image translation result
   */
  async translateImage(imageData, sourceLang = 'auto', targetLang) {
    try {
      const response = await this.api.post('/translate/image', {
        imageData,
        sourceLang,
        targetLang,
      });
      return response.data;
    } catch (error) {
      console.error('Image translation API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get list of supported languages
   * @returns {Promise<Array>} List of supported languages
   */
  async getSupportedLanguages() {
    try {
      const response = await this.api.get('/translate/languages');
      return response.data;
    } catch (error) {
      console.error('Get languages API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Detect language from text
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Detection result
   */
  async detectLanguage(text) {
    try {
      const response = await this.api.post('/translate/detect', {
        text,
      });
      return response.data;
    } catch (error) {
      console.error('Language detection API error:', error);
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
   * Check API health
   * @returns {Promise<boolean>} API health status
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
        timeout: 5000,
      });
      return response.data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export default new TranslationAPI();
