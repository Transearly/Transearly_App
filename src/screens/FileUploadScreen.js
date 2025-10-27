import React, { useState } from 'react';
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
import TranslationAPI from '../services/api';

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
  const [targetLang, setTargetLang] = useState('vi');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setSelectedFile({
          name: result.name,
          uri: result.uri,
          size: result.size,
          mimeType: result.mimeType,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadAndTranslate = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const result = await TranslationAPI.translateFile(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType,
        targetLang,
        'auto'
      );

      setIsUploading(false);

      if (result.success) {
        navigation.navigate('TranslationResult', {
          originalText: `File: ${selectedFile.name}`,
          translatedText: result.data.translatedText,
          sourceLang: result.data.sourceLang || 'auto',
          targetLang: targetLang,
          mode: 'file',
        });
      } else {
        Alert.alert('Translation Failed', result.error || 'Could not translate file');
      }
    } catch (error) {
      setIsUploading(false);
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload file: ' + error.message);
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
          <Text style={styles.sectionTitle}>Select File</Text>
          {selectedFile ? (
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
          ) : (
            <TouchableOpacity 
              style={styles.pickButton} 
              onPress={pickDocument}
              disabled={isUploading}
            >
              <Ionicons name="cloud-upload-outline" size={48} color="#5B67F5" />
              <Text style={styles.pickButtonText}>Choose File</Text>
              <Text style={styles.pickButtonSubtext}>Max 50MB</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Language</Text>
          <View style={styles.languageSelector}>
            {['vi', 'en', 'ja', 'zh', 'ko', 'fr', 'de', 'es'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageChip,
                  targetLang === lang && styles.languageChipActive
                ]}
                onPress={() => setTargetLang(lang)}
              >
                <Text style={[
                  styles.languageChipText,
                  targetLang === lang && styles.languageChipTextActive
                ]}>
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedFile && (
          <TouchableOpacity
            style={[styles.translateButton, isUploading && styles.translateButtonDisabled]}
            onPress={uploadAndTranslate}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="language" size={24} color="#fff" />
                <Text style={styles.translateButtonText}>Translate File</Text>
              </>
            )}
          </TouchableOpacity>
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
          style={styles.navButton}
          onPress={() => navigation.navigate('TranslationDiscovery')}
        >
          <Ionicons name="compass-outline" size={28} color="#999" />
          <Text style={styles.navText}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('TextTranslator')}
        >
          <Ionicons name="text-outline" size={28} color="#999" />
          <Text style={styles.navText}>Text</Text>
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
  languageSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageChip: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  languageChipActive: {
    backgroundColor: '#5B67F5',
    borderColor: '#5B67F5',
  },
  languageChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  languageChipTextActive: {
    color: '#fff',
  },
  translateButton: {
    backgroundColor: '#5B67F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 15,
    marginBottom: 20,
    gap: 10,
  },
  translateButtonDisabled: {
    opacity: 0.6,
  },
  translateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
});
