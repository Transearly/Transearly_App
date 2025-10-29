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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function VoiceRecordingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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
    <LinearGradient colors={['#f0f4ff', '#e8f5f0']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Translation</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={22} color="#5B67F5" />
        </TouchableOpacity>
      </View>

      {/* Language Selector */}
      <View style={styles.languageRow}>
        <TouchableOpacity style={styles.langButton} onPress={() => setShowSourcePicker(true)}>
          <Text style={styles.langText}>
            {SOURCE_LANGUAGES.find(l => l.code === sourceLang)?.flag}{' '}
            {SOURCE_LANGUAGES.find(l => l.code === sourceLang)?.name}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#5B67F5" />
        </TouchableOpacity>

        <View style={styles.swapContainer}>
          <Ionicons name="arrow-forward" size={22} color="#5B67F5" />
        </View>

        <TouchableOpacity style={styles.langButton} onPress={() => setShowTargetPicker(true)}>
          <Text style={styles.langText}>
            {TARGET_LANGUAGES.find(l => l.code === targetLang)?.flag}{' '}
            {TARGET_LANGUAGES.find(l => l.code === targetLang)?.name}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#5B67F5" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {showResult ? (
        <ScrollView style={styles.resultWrapper} showsVerticalScrollIndicator={false}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>Original ({detectedSourceLang})</Text>
              <TouchableOpacity onPress={() => handleCopyText(originalText, 'Original')}>
                <Ionicons name="copy-outline" size={18} color="#5B67F5" />
              </TouchableOpacity>
            </View>
            <Text style={styles.originalText}>{originalText}</Text>
          </View>

          <View style={styles.arrowDown}>
            <Ionicons name="arrow-down" size={26} color="#5B67F5" />
          </View>

          <View style={[styles.resultCard, styles.resultCardBlue]}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultLabel, { color: '#fff' }]}>Translation ({detectedTargetLang})</Text>
              <TouchableOpacity onPress={() => handleCopyText(translatedText, 'Translation')}>
                <Ionicons name="copy-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.translatedText}>{translatedText}</Text>
          </View>

          <TouchableOpacity style={styles.tryButton} onPress={handleTryAgain}>
            <Ionicons name="refresh" size={22} color="#fff" />
            <Text style={styles.tryText}>Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.centerArea}>
          {isProcessing ? (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#5B67F5" />
              <Text style={styles.processingText}>Processing audio...</Text>
            </View>
          ) : (
            <>
              <Animated.View
                style={[
                  styles.pulseCircle,
                  { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 },
                ]}
              />
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micActive]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                <Ionicons name={isRecording ? 'square' : 'mic'} size={40} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.recordHint}>
                {isRecording ? 'Recording... Release to translate' : 'Tap to start recording'}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={{ paddingBottom: insets.bottom }}>
        <BottomNavigation navigation={navigation} activeScreen="voice" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },

  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  langText: { fontSize: 16, color: '#5B67F5', fontWeight: '600', marginRight: 6 },
  swapContainer: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pulseCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#5B67F5',
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#5B67F5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  micActive: { backgroundColor: '#FF4458', shadowColor: '#FF4458' },
  recordHint: { marginTop: 30, fontSize: 16, color: '#555', fontWeight: '500' },

  processingText: { marginTop: 15, fontSize: 16, color: '#666' },

  resultWrapper: { paddingHorizontal: 20, marginTop: 10 },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    elevation: 4,
  },
  resultCardBlue: { backgroundColor: '#5B67F5' },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: { fontSize: 14, fontWeight: '600', color: '#888' },
  originalText: { fontSize: 18, color: '#333', lineHeight: 26 },
  translatedText: { fontSize: 20, color: '#fff', lineHeight: 30, fontWeight: '600' },
  arrowDown: { alignSelf: 'center', marginVertical: 8 },
  tryButton: {
    flexDirection: 'row',
    backgroundColor: '#5B67F5',
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 28,
    marginTop: 15,
  },
  tryText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
