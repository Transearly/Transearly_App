import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import translationAPI from '../services/api';

const SUPPORTED_TYPES = [
  { ext: '.txt', icon: 'document-text', name: 'Text' },
  { ext: '.pdf', icon: 'document', name: 'PDF' },
  { ext: '.docx', icon: 'document-text', name: 'Word' },
  { ext: '.xlsx', icon: 'grid', name: 'Excel' },
  { ext: '.pptx', icon: 'layers', name: 'PowerPoint' },
];

export default function FileUploadScreen({ navigation }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLang, setTargetLang] = useState('English');
  const [progress, setProgress] = useState('');
  const api = translationAPI;

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
      await api.initializeWebSocket();
      setupWebSocketListeners();
      console.log('WebSocket initialized successfully');
      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      console.error('Error message:', error.message);
      
      // Don't show error - we'll use fallback ID
      console.log('Will proceed with fallback ID for file upload');
      return true; // Always return true so upload can proceed
    }
  };

  const setupWebSocketListeners = () => {
    console.log('Setting up WebSocket listeners...');
    api.addTranslationListeners(
      async (data) => {
        // Handle translation complete
        console.log('Translation complete event received:', data);
        setIsProcessing(false);
        setProgress('Translation completed!');
        
        try {
          console.log('Downloading file:', data.fileName);
          const blob = await api.downloadTranslatedFile(data.fileName);
          const fileUri = `${FileSystem.documentDirectory}${data.fileName}`;
          
          // Convert blob to base64 for React Native
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];
            
            await FileSystem.writeAsStringAsync(fileUri, base64data, {
              encoding: FileSystem.EncodingType.Base64,
            });

            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(fileUri, {
                mimeType: 'application/octet-stream',
                dialogTitle: 'Download translated file',
              });
            } else {
              Alert.alert('Success', 'File has been saved to your device');
            }
          };
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error('Download error:', error);
          Alert.alert('Download Error', 'Failed to download translated file');
        }
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

      // Try to initialize WebSocket connection (but don't wait for success)
      console.log('Attempting WebSocket connection (non-blocking)...');
      initializeWebSocket().catch(error => {
        console.error('WebSocket initialization failed:', error);
      });

      setProgress('Uploading file...');

      // Create a proper file object for FormData
      const formFile = {
        uri: fileInfo.uri,
        type: fileInfo.type,
        name: fileInfo.name,
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
        false // isUserPremium
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

  return (
    <LinearGradient
      colors={['#f0f4ff', '#e8f5f0']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>File Translation</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="diamond-outline" size={24} color="#FFB800" style={styles.icon} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supported File Types</Text>
          <View style={styles.fileTypes}>
            {SUPPORTED_TYPES.map((type) => (
              <View key={type.ext} style={styles.fileTypeCard}>
                <Ionicons name={type.icon} size={32} color="#5B67F5" />
                <Text style={styles.fileTypeName}>{type.name}</Text>
                <Text style={styles.fileTypeExt}>{type.ext}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Language</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                targetLang === 'English' && styles.languageButtonActive,
              ]}
              onPress={() => setTargetLang('English')}
              disabled={isUploading || isProcessing}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  targetLang === 'English' && styles.languageButtonTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                targetLang === 'Vietnamese' && styles.languageButtonActive,
              ]}
              onPress={() => setTargetLang('Vietnamese')}
              disabled={isUploading || isProcessing}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  targetLang === 'Vietnamese' && styles.languageButtonTextActive,
                ]}
              >
                Vietnamese
              </Text>
            </TouchableOpacity>
          </View>
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
              <Text style={styles.pickButtonText}>Choose File</Text>
              <Text style={styles.pickButtonSubtext}>Max 50MB</Text>
            </TouchableOpacity>
          )}
        </View>

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

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonActive]}
          onPress={() => navigation.navigate('TextTranslator')}
        >
          <Ionicons name="home-outline" size={28} color="#5B67F5" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('CameraTranslate')}
        >
          <Ionicons name="camera-outline" size={28} color="#999" />
          <Text style={styles.navText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonActive]}
        >
          <Ionicons name="document" size={28} color="#5B67F5" />
          <Text style={[styles.navText, styles.navTextActive]}>File</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  fileTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fileTypeCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: '18%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileTypeName: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    fontWeight: '600',
  },
  fileTypeExt: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
  },
  languageButtonActive: {
    borderColor: '#5B67F5',
    backgroundColor: '#5B67F5',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#fff',
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navButton: {
    alignItems: 'center',
  },
  navButtonActive: {},
  navText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  navTextActive: {
    color: '#5B67F5',
    fontWeight: '600',
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
});