import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import translationAPI from '../services/api';
import BottomNavigation from '../components/BottomNavigation';
import { SOURCE_LANGUAGES, TARGET_LANGUAGES, getLanguageName } from '../constants/languages';

const { width } = Dimensions.get('window');

export default function VoiceRecordingScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('vi');
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedSourceLang, setDetectedSourceLang] = useState('');
  const [detectedTargetLang, setDetectedTargetLang] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      const permission = await Audio.requestPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    console.log('Stopping recording..');
    setIsRecording(false);
    pulseAnim.setValue(1);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      
      setRecording(null);
      
      // Translate the audio
      if (uri) {
        await translateAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to process recording: ' + err.message);
    }
  };

  const getAudioFileInfo = (uri) => {
    // Determine file type and mime type based on URI extension
    const extension = uri.split('.').pop().toLowerCase();

    const mimeTypeMap = {
      'm4a': 'audio/mp4',
      'mp4': 'audio/mp4',
      'mp3': 'audio/mpeg',
      '3gp': 'audio/3gpp',
      'wav': 'audio/wav',
      'caf': 'audio/x-caf',
    };

    const mimeType = mimeTypeMap[extension] || 'audio/mpeg';
    const fileName = `recording_${Date.now()}.${extension}`;

    return { mimeType, fileName };
  };

  const handleCopyText = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const translateAudio = async (audioUri) => {
    setIsProcessing(true);
    try {
      console.log('Starting audio translation for URI:', audioUri);

      const targetLanguageName = getLanguageName(targetLang);

      // Get correct file info based on URI
      const { mimeType, fileName } = getAudioFileInfo(audioUri);

      // Create audio file object
      const audioFile = {
        uri: audioUri,
        type: mimeType,
        name: fileName,
      };

      console.log('Sending audio file to API:', audioFile);
      console.log('Source language:', sourceLang, 'Target language:', targetLanguageName);

      // Call API to translate audio with source language
      const result = await translationAPI.translateAudio(audioFile, sourceLang, targetLanguageName);

      console.log('Audio translation result:', result);

      setIsProcessing(false);

      if (result.success) {
        // Show result on same screen
        setOriginalText(result.originalText);
        setTranslatedText(result.translatedText);

        // Extract detected language codes from audioDetails
        const detectedLang = result.audioDetails?.detectedLanguage || '';
        // Map from Google language codes (e.g., 'vi-VN') to our codes (e.g., 'vi')
        const langCode = detectedLang.split('-')[0]; // Extract 'vi' from 'vi-VN'
        const sourceLangName = SOURCE_LANGUAGES.find(l => l.code === langCode)?.fullName || langCode;

        setDetectedSourceLang(sourceLangName);
        setDetectedTargetLang(targetLanguageName);
        setShowResult(true);
      } else {
        Alert.alert('No Speech Detected', result.message || 'Could not detect any speech in the audio recording.');
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('Translation error:', error);
      Alert.alert(
        'Translation Error',
        error.message || 'Failed to translate audio. Please try again.'
      );
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setOriginalText('');
    setTranslatedText('');
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
        <Text style={styles.title}>Voice Translation</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="diamond-outline" size={24} color="#FFB800" style={styles.icon} />
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#5B67F5" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.languageSelector}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowSourcePicker(true)}
        >
          <Text style={styles.languageText}>
            {SOURCE_LANGUAGES.find(l => l.code === sourceLang)?.flag} {SOURCE_LANGUAGES.find(l => l.code === sourceLang)?.name}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#5B67F5" />
        </TouchableOpacity>
        <Ionicons name="arrow-forward" size={24} color="#5B67F5" />
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowTargetPicker(true)}
        >
          <Text style={styles.languageText}>
            {TARGET_LANGUAGES.find(l => l.code === targetLang)?.flag} {TARGET_LANGUAGES.find(l => l.code === targetLang)?.name}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#5B67F5" />
        </TouchableOpacity>
      </View>

      {showResult ? (
        // Show translation result
        <View style={styles.resultContainer}>
          <View style={styles.resultCard}>
            <View style={styles.labelContainer}>
              <Text style={styles.resultLabel}>Original</Text>
              {detectedSourceLang && (
                <Text style={styles.languageLabel}>({detectedSourceLang})</Text>
              )}
            </View>
            <Text style={styles.resultText}>{originalText}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => handleCopyText(originalText, 'Original text')}
            >
              <Ionicons name="copy-outline" size={20} color="#5B67F5" />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-down" size={24} color="#5B67F5" />
          </View>

          <View style={[styles.resultCard, styles.translatedCard]}>
            <View style={styles.labelContainer}>
              <Text style={[styles.resultLabel, { color: '#fff', opacity: 0.8 }]}>Translation</Text>
              {detectedTargetLang && (
                <Text style={[styles.languageLabel, { color: '#fff', opacity: 0.7 }]}>({detectedTargetLang})</Text>
              )}
            </View>
            <Text style={styles.translatedText}>{translatedText}</Text>
            <TouchableOpacity
              style={[styles.copyButton, styles.copyButtonWhite]}
              onPress={() => handleCopyText(translatedText, 'Translation')}
            >
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={[styles.copyButtonText, { color: '#fff' }]}>Copy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={handleTryAgain}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.recordingArea}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#5B67F5" />
                <Text style={styles.processingText}>Processing audio...</Text>
              </View>
            ) : (
              <>
                <Animated.View
                  style={[
                    styles.pulseCircle,
                    {
                      transform: [{ scale: isRecording ? pulseAnim : 1 }],
                      opacity: isRecording ? 0.3 : 0,
                    },
                  ]}
                />
                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordingButton,
                  ]}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                >
                  <Ionicons
                    name={isRecording ? "square" : "mic"}
                    size={40}
                    color="#fff"
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.instructionArea}>
            <Text style={styles.instructionTitle}>
              {isRecording ? 'Recording...' : 'Tap And Hold'}
            </Text>
            <Text style={styles.instructionSubtitle}>
              {isRecording ? 'Release to translate' : 'To Record'}
            </Text>
          </View>
        </>
      )}

      {/* Source Language Picker Modal */}
      <Modal
        visible={showSourcePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSourcePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Source Language</Text>
              <TouchableOpacity onPress={() => setShowSourcePicker(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {SOURCE_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    sourceLang === lang.code && styles.languageItemActive,
                  ]}
                  onPress={() => {
                    setSourceLang(lang.code);
                    setShowSourcePicker(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    sourceLang === lang.code && styles.languageNameActive,
                  ]}>
                    {lang.name}
                  </Text>
                  {sourceLang === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#5B67F5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Target Language Picker Modal */}
      <Modal
        visible={showTargetPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTargetPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Target Language</Text>
              <TouchableOpacity onPress={() => setShowTargetPicker(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {TARGET_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    targetLang === lang.code && styles.languageItemActive,
                  ]}
                  onPress={() => {
                    setTargetLang(lang.code);
                    setShowTargetPicker(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    targetLang === lang.code && styles.languageNameActive,
                  ]}>
                    {lang.name}
                  </Text>
                  {targetLang === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#5B67F5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNavigation navigation={navigation} activeScreen="voice" />
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
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageText: {
    fontSize: 16,
    color: '#5B67F5',
    fontWeight: '600',
    marginRight: 8,
  },
  swapButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  pulseCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#5B67F5',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#5B67F5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B67F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#FF4458',
    shadowColor: '#FF4458',
  },
  instructionArea: {
    alignItems: 'center',
    marginBottom: 60,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  translatedCard: {
    backgroundColor: '#5B67F5',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
  },
  languageLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
  },
  translatedText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 30,
  },
  arrowContainer: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  tryAgainButton: {
    flexDirection: 'row',
    backgroundColor: '#5B67F5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    alignSelf: 'center',
    shadowColor: '#5B67F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tryAgainText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  languageItemActive: {
    backgroundColor: '#f0f4ff',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 15,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  languageNameActive: {
    color: '#5B67F5',
    fontWeight: '600',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#f0f4ff',
    marginTop: 10,
  },
  copyButtonWhite: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  copyButtonText: {
    fontSize: 14,
    color: '#5B67F5',
    fontWeight: '600',
    marginLeft: 6,
  },
});
