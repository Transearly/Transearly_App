import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import TranslationAPI from '../services/api';

export default function TranslationResultScreen({ navigation, route }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [originalText, setOriginalText] = useState('');

  const { mode, imageUri, imageBase64, sourceLang, targetLang } = route.params || {};

  useEffect(() => {
    if (route.params?.translatedText) {
      // If translation already done
      setTranslatedText(route.params.translatedText);
      setOriginalText(route.params.originalText || '');
    } else if (mode === 'image' && imageBase64) {
      // Need to translate image
      translateImage();
    }
  }, []);

  const translateImage = async () => {
    setIsLoading(true);
    try {
      const result = await TranslationAPI.translateImage(
        imageBase64,
        sourceLang || 'auto',
        targetLang
      );

      if (result.success) {
        setOriginalText(result.data.extractedText);
        setTranslatedText(result.data.translatedText);
      } else {
        Alert.alert('Error', 'Image translation failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to translate image');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const textToCopy = showOriginal ? originalText : translatedText;
    await Clipboard.setStringAsync(textToCopy);
    Alert.alert('Copied', 'Text copied to clipboard');
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#f0f4ff', '#e8f5f0']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B67F5" />
          <Text style={styles.loadingText}>Translating...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#f0f4ff', '#e8f5f0']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={28} color="#5B67F5" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {mode === 'image' && imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.capturedImage}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Show original text</Text>
          <Switch
            value={showOriginal}
            onValueChange={setShowOriginal}
            trackColor={{ false: '#E0E0E0', true: '#5B67F5' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={copyToClipboard}>
          <Ionicons name="copy-outline" size={24} color="#5B67F5" />
        </TouchableOpacity>

        <View style={styles.translationResult}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              {showOriginal ? 'Original Text' : 'Translation Result'}
            </Text>
            <Text style={styles.resultText}>
              {showOriginal ? originalText : translatedText}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('VoiceRecording')}
        >
          <Ionicons name="home-outline" size={28} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('TranslationDiscovery')}
        >
          <Ionicons name="compass-outline" size={28} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="camera" size={28} color="#5B67F5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={28} color="#999" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#5B67F5',
    fontWeight: '600',
  },
  capturedImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#C8E6C9',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBoard: {
    backgroundColor: '#2C2C2C',
    padding: 20,
    borderRadius: 10,
    width: '70%',
  },
  menuTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  menuDivider: {
    height: 2,
    backgroundColor: '#fff',
    marginVertical: 8,
  },
  menuItem: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 2,
  },
  menuLabel: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    marginVertical: 2,
  },
  translateButton: {
    backgroundColor: '#5B67F5',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  translateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  iconButton: {
    alignSelf: 'center',
    padding: 10,
    marginBottom: 10,
  },
  translationResult: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navItem: {
    padding: 10,
  },
});
