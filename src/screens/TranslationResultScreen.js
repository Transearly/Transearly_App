import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import translationAPI from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TranslationResultScreen({ navigation, route }) {
  const [showOriginalText, setShowOriginalText] = useState(false); // Toggle original vs translated
  const [isLoading, setIsLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [segments, setSegments] = useState([]); // Text segments with positions
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });

  const { mode, imageUri, imageBase64, sourceLang, targetLang } = route.params || {};

  useEffect(() => {
    console.log('TranslationResult - route.params:', route.params);
    if (route.params?.translatedText) {
      // If translation already done
      console.log('Setting translated text:', route.params.translatedText);
      console.log('Setting original text:', route.params.originalText);
      console.log('Segments:', route.params.segments);
      setTranslatedText(route.params.translatedText);
      setOriginalText(route.params.originalText || '');
      setSegments(route.params.segments || []);
    } else if (mode === 'image' && imageBase64) {
      // Need to translate image
      translateImage();
    }
  }, []);

  const translateImage = async () => {
    setIsLoading(true);
    try {
      const result = await translationAPI.translateImage(
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

  // For image mode, show fullscreen overlay
  if (mode === 'image' && imageUri) {
    return (
      <View style={styles.fullscreenContainer}>
        {/* Header with back and toggle */}
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.languageToggle}
            onPress={() => setShowOriginalText(!showOriginalText)}
          >
            <Text style={styles.languageToggleText}>
              {showOriginalText ? 'Original' : 'Translated'}
            </Text>
            <Ionicons name="swap-horizontal" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Clipboard.setStringAsync(showOriginalText ? originalText : translatedText);
              Alert.alert('Copied', 'Text copied to clipboard');
            }}
          >
            <Ionicons name="copy" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Fullscreen image with overlays */}
        <View style={styles.imageFullscreenContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.fullscreenImage}
            resizeMode="contain"
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setImageLayout({ width, height });
            }}
          />

          {/* Render positioned overlays */}
          {segments.length > 0 && imageLayout.width > 0 && segments.map((segment, index) => {
            const { position } = segment;
            const left = (position.x / 100) * imageLayout.width;
            const top = (position.y / 100) * imageLayout.height;
            const width = (position.width / 100) * imageLayout.width;
            const height = (position.height / 100) * imageLayout.height;

            return (
              <View
                key={index}
                style={[
                  styles.fullscreenOverlay,
                  {
                    left,
                    top,
                    width: Math.max(width, 60),
                    minHeight: Math.max(height, 25),
                  },
                ]}
              >
                <Text style={styles.fullscreenOverlayText} numberOfLines={4}>
                  {showOriginalText ? segment.original : segment.translated}
                </Text>
              </View>
            );
          })}

          {/* Fallback single overlay at bottom */}
          {segments.length === 0 && translatedText && (
            <View style={styles.fallbackOverlay}>
              <Text style={styles.fallbackOverlayText}>
                {showOriginalText ? (originalText || 'No original text') : translatedText}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // For non-image modes, show regular layout
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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {mode !== 'image' && (
          <>
            {showOriginalText ? (
              // Image with Positioned Translation Overlays
              <View style={styles.overlayContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.capturedImage}
                  resizeMode="contain"
                  onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setImageLayout({ width, height });
                  }}
                />

                {/* Render each segment at its position */}
                {segments.length > 0 && imageLayout.width > 0 && segments.map((segment, index) => {
                  const { position } = segment;
                  // Convert percentage to actual pixels
                  const left = (position.x / 100) * imageLayout.width;
                  const top = (position.y / 100) * imageLayout.height;
                  const width = (position.width / 100) * imageLayout.width;
                  const height = (position.height / 100) * imageLayout.height;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.positionedOverlay,
                        {
                          left,
                          top,
                          width: Math.max(width, 50), // Minimum width
                          minHeight: Math.max(height, 20), // Minimum height
                        },
                      ]}
                    >
                      <Text style={styles.positionedText} numberOfLines={3}>
                        {segment.translated}
                      </Text>
                    </View>
                  );
                })}

                {/* Fallback if no segments */}
                {segments.length === 0 && translatedText && (
                  <View style={styles.translationOverlay}>
                    <View style={styles.overlayBox}>
                      <Text style={styles.overlayText}>{translatedText}</Text>
                    </View>
                  </View>
                )}

                {/* Copy button for overlay mode */}
                <TouchableOpacity
                  style={styles.floatingCopyButton}
                  onPress={() => {
                    Clipboard.setStringAsync(translatedText);
                    Alert.alert('Copied', 'Translation copied to clipboard');
                  }}
                >
                  <Ionicons name="copy" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              // Text-only view (original layout)
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.capturedImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </>
        )}

        {!showOverlay && (
          <>
            {/* Original Text Section */}
            {originalText && originalText.trim() !== '' && (
              <View style={styles.textSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Original Text</Text>
                  <TouchableOpacity onPress={() => {
                    Clipboard.setStringAsync(originalText);
                    Alert.alert('Copied', 'Original text copied to clipboard');
                  }}>
                    <Ionicons name="copy-outline" size={20} color="#5B67F5" />
                  </TouchableOpacity>
                </View>
                <View style={styles.resultCard}>
                  <Text style={styles.resultText}>{originalText}</Text>
                </View>
              </View>
            )}

            {/* Translated Text Section */}
            <View style={styles.textSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Translation Result</Text>
                {translatedText && translatedText.trim() !== '' && (
                  <TouchableOpacity onPress={() => {
                    Clipboard.setStringAsync(translatedText);
                    Alert.alert('Copied', 'Translated text copied to clipboard');
                  }}>
                    <Ionicons name="copy-outline" size={20} color="#5B67F5" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.resultCard}>
                <Text style={styles.resultText}>
                  {translatedText && translatedText.trim() !== ''
                    ? translatedText
                    : 'No translation available'}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('VoiceRecording')}
        >
          <Ionicons name="home-outline" size={28} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('TextTranslator')}
        >
          <Ionicons name="home-outline" size={28} color="#5B67F5" />
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
    height: 400,
    borderRadius: 20,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
    marginBottom: 15,
    alignSelf: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#5B67F5',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B67F5',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  overlayContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  translationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 20,
  },
  overlayBox: {
    backgroundColor: 'rgba(91, 103, 245, 0.9)',
    borderRadius: 12,
    padding: 15,
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  floatingCopyButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(91, 103, 245, 0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  positionedOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(91, 103, 245, 0.92)',
    padding: 8,
    borderRadius: 6,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  positionedText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  textSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    minHeight: 120,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 15,
    color: '#333',
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
