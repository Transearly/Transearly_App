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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import TranslationAPI from '../services/api';

const { width } = Dimensions.get('window');

export default function VoiceRecordingScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('vi');

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

  const translateAudio = async (audioUri) => {
    setIsProcessing(true);
    try {
      console.log('Translating audio from:', audioUri);
      
      const result = await TranslationAPI.translateVoice(
        audioUri,
        targetLang,
        sourceLang
      );

      setIsProcessing(false);

      if (result.success) {
        // Navigate to result screen with translation
        navigation.navigate('TranslationResult', {
          originalText: result.data.originalText || 'Voice input',
          translatedText: result.data.translatedText,
          sourceLang: result.data.sourceLang || sourceLang,
          targetLang: targetLang,
        });
      } else {
        Alert.alert('Translation Failed', result.error || 'Could not translate audio');
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('Translation error:', error);
      Alert.alert('Error', 'Failed to translate: ' + error.message);
    }
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
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageText}>
            {sourceLang === 'auto' ? 'Auto Detect' : sourceLang.toUpperCase()} 🎤
          </Text>
          <Ionicons name="chevron-down" size={16} color="#5B67F5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.swapButton}>
          <Ionicons name="swap-horizontal" size={24} color="#5B67F5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageText}>{targetLang.toUpperCase()} 🔊</Text>
          <Ionicons name="chevron-down" size={16} color="#5B67F5" />
        </TouchableOpacity>
      </View>

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

      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('TranslationDiscovery')}
        >
          <Ionicons name="compass-outline" size={28} color="#999" />
          <Text style={styles.navText}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, styles.navButtonActive]}
        >
          <Ionicons name="mic" size={28} color="#5B67F5" />
          <Text style={[styles.navText, styles.navTextActive]}>Voice</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('TextTranslator')}
        >
          <Ionicons name="text-outline" size={28} color="#999" />
          <Text style={styles.navText}>Text</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('CameraTranslate')}
        >
          <Ionicons name="camera-outline" size={28} color="#999" />
          <Text style={styles.navText}>Camera</Text>
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
  navButtonActive: {
    // Active state
  },
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
