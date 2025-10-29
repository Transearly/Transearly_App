import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as IntentLauncher from 'expo-intent-launcher';
import translationAPI from '../services/api';
import { API_BASE_URL } from '../config/api.config';
import BottomNavigation from '../components/BottomNavigation';

const SUPPORTED_TYPES = [
  { ext: '.txt', icon: 'document-text', name: 'Text' },
  { ext: '.pdf', icon: 'document', name: 'PDF' },
  { ext: '.docx', icon: 'document-text', name: 'Word' },
  { ext: '.xlsx', icon: 'grid', name: 'Excel' },
  { ext: '.pptx', icon: 'layers', name: 'PowerPoint' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
];

export default function FileUploadScreen({ navigation }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLang, setTargetLang] = useState('Vietnamese');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [progress, setProgress] = useState('');
  const [downloadedFile, setDownloadedFile] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const api = translationAPI;

  const resetState = () => {
    console.log('Resetting state to initial...');
    setSelectedFile(null);
    setDownloadedFile(null);
    setProgress('');
    setIsUploading(false);
    setIsProcessing(false);
    setIsDownloading(false);
  };

  useEffect(() => {
    // Don't initialize WebSocket on component mount
    // It will be initialized when user actually uploads a file
    return () => {
      // Clean up on unmount
      if (api.socket) {
        api.removeTranslationListeners();
        api.disconnect();
      }
    };
  }, []);

  const initializeWebSocket = async () => {
    try {
      console.log('Attempting to initialize WebSocket...');
      const socketId = await api.initializeWebSocket();
      setupWebSocketListeners();
      console.log('WebSocket initialized successfully with ID:', socketId);
      return socketId;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      console.error('Error message:', error.message);
      
      // Don't show error - we'll use fallback ID
      console.log('Will proceed with fallback ID for file upload');
      const fallbackId = 'fallback-' + Date.now();
      api.socketId = fallbackId; // Set fallback ID
      return fallbackId; // Always return an ID so upload can proceed
    }
  };

  const setupWebSocketListeners = () => {
    console.log('Setting up WebSocket listeners...');
    
    // Check if socket is actually connected
    if (!api.socket) {
      console.log('Socket is not initialized in setupWebSocketListeners');
      return;
    }
    
    // Listen to all events for debugging
    api.socket.onAny((eventName, ...args) => {
      console.log(`Received event: ${eventName}`, args);
    });
    
    api.addTranslationListeners(
      async (data) => {
        // Handle translation complete
        console.log('Translation complete event received:', data);
        setIsProcessing(false);
        setProgress('Translation completed!');
        
        // Store file info for download
        setDownloadedFile({
          fileName: data.fileName,
          downloadUrl: `${API_BASE_URL}/translator/download/${data.fileName}`
        });
      },
      (error) => {
        // Handle translation failed
        console.log('Translation failed event received:', error);
        setIsProcessing(false);
        setProgress('');
        Alert.alert('Translation Failed', error.reason || 'An error occurred during translation');
      }
    );
  };

  const handleDownload = async () => {
    if (!downloadedFile) return;
    
    try {
      setIsDownloading(true);
      console.log('Downloading file:', downloadedFile.fileName);
      console.log('Download URL:', downloadedFile.downloadUrl);
      
      // Download to temporary location first
      const tempUri = FileSystem.cacheDirectory + downloadedFile.fileName;
      console.log(`Download attempt 1 of 3`);
      
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadedFile.downloadUrl,
        tempUri,
        {},
        (downloadProgressInfo) => {
          const progress = downloadProgressInfo.totalBytesWritten / downloadProgressInfo.totalBytesExpectedToWrite;
          console.log(`Download progress: ${Math.round(progress * 100)}%`);
        }
      );
      
      const result = await downloadResumable.downloadAsync();
      console.log('File downloaded to:', result.uri);
      
      // Verify file exists and has content
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      console.log('File info:', fileInfo);
      if (fileInfo.exists && fileInfo.size > 0) {
        console.log(`File successfully downloaded. Size: ${fileInfo.size} bytes`);
        // Copy file to external storage for Android
        let finalUri = result.uri;
        let asset = null; // Move asset declaration to higher scope
        if (Platform.OS === 'android') {
          try {
            // Request media library permissions first
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
              // Create a copy in the device's external storage first
              const externalDir = FileSystem.documentDirectory + 'translated/';
              await FileSystem.makeDirectoryAsync(externalDir, { intermediates: true }).catch(() => {});
              const externalUri = externalDir + downloadedFile.fileName;
              await FileSystem.copyAsync({
                from: result.uri,
                to: externalUri
              });
              
              // Verify the copy was successful
              const copiedFileInfo = await FileSystem.getInfoAsync(externalUri);
              if (copiedFileInfo.exists && copiedFileInfo.size > 0) {
                console.log(`File successfully copied to: ${externalUri}, Size: ${copiedFileInfo.size} bytes`);
                
                // Create asset in DCIM (MediaLibrary saves to DCIM by default)
                asset = await MediaLibrary.createAssetAsync(externalUri, null, downloadedFile.fileName);
                console.log('Asset created in DCIM:', asset);
                finalUri = asset.uri;
              } else {
                console.error('Failed to copy file to external storage');
                finalUri = result.uri;
              }
            } else {
              // Fallback to cache if no permission
              finalUri = result.uri;
            }
          } catch (copyError) {
            console.error('Error with MediaLibrary:', copyError);
            // Fallback to cache if copy fails
            finalUri = result.uri;
          }
        }
        
        // Show options after download
        Alert.alert(
          'Download Complete',
          'File downloaded successfully! What would you like to do?',
          [
            {
              text: 'Open File',
              onPress: async () => {
                try {
                  if (Platform.OS === 'android') {
                    // Use IntentLauncher to open the file from DCIM
                    const mimeType = api.getMimeType(downloadedFile.fileName);
                    console.log('Opening file with MIME type:', mimeType);
                    console.log('Using DCIM asset URI:', finalUri);
                    
                    // Create content URI using asset ID for better compatibility
                    let contentUri = finalUri;
                    if (asset && asset.id) {
                      // Use content URI with asset ID for proper access
                      contentUri = `content://media/external/file/${asset.id}`;
                      console.log('Using content URI with asset ID:', contentUri);
                    }
                    
                    try {
                      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                        data: contentUri,
                        type: mimeType,
                        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                      });
                    } catch (intentError) {
                      console.error('Error opening file with IntentLauncher:', intentError);
                      
                      // Try using the copied file in document directory as fallback
                      if (finalUri.startsWith('file://')) {
                        const filePath = finalUri.replace('file://', '');
                        const documentContentUri = `content://com.android.externalstorage.documents/document/primary:${filePath}`;
                        console.log('Trying fallback with document content URI:', documentContentUri);
                        
                        try {
                          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                            data: documentContentUri,
                            type: mimeType,
                            flags: 1,
                          });
                        } catch (fallbackError) {
                          console.error('Fallback also failed:', fallbackError);
                          
                          // Final fallback to Sharing
                          if (await Sharing.isAvailableAsync()) {
                            await Sharing.shareAsync(finalUri, {
                              mimeType: api.getMimeType(downloadedFile.fileName),
                              dialogTitle: 'Open translated file',
                            });
                          } else {
                            Alert.alert(
                              'File Downloaded',
                              `File downloaded as: ${downloadedFile.fileName}\n\nPlease open it from your file manager at:\n${finalUri}`
                            );
                          }
                        }
                      }
                    }
                    resetState();
                  } else {
                    // For iOS, use Sharing
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(finalUri, {
                        mimeType: api.getMimeType(downloadedFile.fileName),
                        dialogTitle: 'Open translated file',
                      });
                    }
                    resetState();
                  }
                } catch (error) {
                  console.error('Error opening file:', error);
                  
                  // Fallback to Sharing
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(finalUri, {
                      mimeType: api.getMimeType(downloadedFile.fileName),
                      dialogTitle: 'Open with document reader...',
                    });
                  } else {
                    Alert.alert(
                      'File Downloaded',
                      `File downloaded as: ${downloadedFile.fileName}\n\nPlease open it from your file manager.`
                    );
                  }
                }
              }
            },
            {
              text: 'Done',
              style: 'cancel',
              onPress: () => {
                resetState();
              }
            }
          ]
        );
      } else {
        throw new Error('Downloaded file is empty or does not exist');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Error', `Failed to download translated file: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const pickDocument = async () => {
    console.log('pickDocument called');
    try {
      console.log('Opening document picker...');
      
      // Try without specifying types first to see if it works
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);
      console.log('Result canceled:', result.canceled);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileInfo = {
          name: asset.name,
          uri: asset.uri,
          size: asset.size,
          type: asset.mimeType,
        };
        console.log('File selected successfully:', fileInfo);
        setSelectedFile(fileInfo);
        console.log('selectedFile state should be updated');
      } else if (result.canceled) {
        console.log('File selection cancelled');
      } else {
        console.log('Unexpected result structure:', result);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document: ' + error.message);
    }
  };

  const handleUpload = async (fileInfo) => {
    if (!fileInfo) return;

    try {
      setIsUploading(true);
      setProgress('Connecting to translation service...');

      // Initialize WebSocket and get socketId
      console.log('Initializing WebSocket connection...');
      const socketId = await initializeWebSocket();
      console.log('Using socketId for upload:', socketId);

      setProgress('Uploading file...');

      // Create a proper file object for FormData
      const formFile = {
        uri: fileInfo.uri,
        type: fileInfo.type,
        name: fileInfo.name,
        size: fileInfo.size, // Add file size
      };

      console.log('Uploading file with details:', {
        name: formFile.name,
        type: formFile.type,
        targetLang: targetLang,
        socketId: api.socketId
      });

      const response = await api.uploadFileForTranslation(
        formFile,
        targetLang,
        true // isUserPremium
      );

      setIsUploading(false);
      setIsProcessing(true);
      setProgress('Processing translation...');

      console.log('Upload successful:', response);
      console.log('Job ID:', response.data?.jobId);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setIsProcessing(false);
      setProgress('');
      
      // Provide more specific error messages
      if (error.message && error.message.includes('Network Error')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else if (error.message && error.message.includes('timeout')) {
        Alert.alert('Timeout Error', 'Connection timed out. Please try again.');
      } else {
        Alert.alert('Upload Error', error.message || 'Failed to upload file');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const selectedLanguage = LANGUAGES.find(lang => lang.name === targetLang) || LANGUAGES[1];

  return (
    <LinearGradient
      colors={['#f0f4ff', '#e8f5f0']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>File Translation</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Language</Text>
          <TouchableOpacity
            style={styles.languageSelector}
            onPress={() => setShowLanguageModal(true)}
            disabled={isUploading || isProcessing}
          >
            <View style={styles.languageSelectorContent}>
              <Text style={styles.languageFlag}>{selectedLanguage.flag}</Text>
              <Text style={styles.languageName}>{selectedLanguage.name}</Text>
            </View>
            <Ionicons name="chevron-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select File</Text>
          {selectedFile ? (
            <View>
              <View style={styles.selectedFileCard}>
                <View style={styles.fileInfo}>
                  <Ionicons name="document" size={40} color="#5B67F5" />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedFile(null)}>
                    <Ionicons name="close-circle" size={28} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleUpload(selectedFile)}
                disabled={isUploading || isProcessing}
              >
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload & Translate</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.pickButton}
              onPress={() => {
                console.log('Choose File button pressed');
                pickDocument();
              }}
              disabled={isUploading || isProcessing}
            >
              <Ionicons name="cloud-upload-outline" size={48} color="#5B67F5" />
              <Text style={styles.pickButtonText}>Choose File To Translate</Text>
              <Text style={styles.pickButtonSubtext}>(.pdf, .docx, .xlsx, .csv, .pptx, .txt)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Download button section */}
        {downloadedFile && (
          <View style={styles.downloadSection}>
            <View style={styles.downloadInfo}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.downloadText}>
                Translation completed! File: {downloadedFile.fileName}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="download" size={24} color="#fff" />
              )}
              <Text style={styles.downloadButtonText}>
                {isDownloading ? 'Downloading...' : 'Download File'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(isUploading || isProcessing) && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color="#5B67F5" />
            <Text style={styles.progressText}>{progress}</Text>
            {isUploading && (
              <Text style={styles.progressSubtext}>
                Please wait while we connect to the translation service...
              </Text>
            )}
            {isProcessing && (
              <Text style={styles.progressSubtext}>
                Your file is being processed. This may take a few minutes.
              </Text>
            )}
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Files are processed securely and deleted after translation
          </Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Target Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    targetLang === lang.name && styles.languageOptionActive
                  ]}
                  onPress={() => {
                    setTargetLang(lang.name);
                    setShowLanguageModal(false);
                  }}
                >
                  <View style={styles.languageOptionContent}>
                    <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                    <Text style={[
                      styles.languageOptionText,
                      targetLang === lang.name && styles.languageOptionTextActive
                    ]}>
                      {lang.name}
                    </Text>
                  </View>
                  {targetLang === lang.name && (
                    <Ionicons name="checkmark" size={24} color="#5B67F5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNavigation navigation={navigation} activeScreen="file" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  premiumButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fileTypesText: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileTypesDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  languageSelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  languageSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  pickButton: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5B67F5',
    borderStyle: 'dashed',
  },
  pickButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5B67F5',
    marginTop: 15,
  },
  pickButtonSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  supportedTypesBox: {
    backgroundColor: '#f8f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e5ff',
  },
  supportedTypesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B67F5',
    marginBottom: 6,
  },
  supportedTypesText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  selectedFileCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 15,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fileSize: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#5B67F5',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  progressSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  uploadButton: {
    backgroundColor: '#5B67F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  downloadSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  downloadText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  languageList: {
    paddingTop: 10,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  languageOptionActive: {
    backgroundColor: '#f0f4ff',
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageOptionFlag: {
    fontSize: 28,
    marginRight: 15,
  },
  languageOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  languageOptionTextActive: {
    color: '#5B67F5',
    fontWeight: '600',
  },
});