import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import translationAPI from '../services/api';
import BottomNavigation from '../components/BottomNavigation';
import { TARGET_LANGUAGES, getLanguageName } from '../constants/languages';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ImageTranslateScreen({ route, navigation }) {
  const { imageUri, targetLanguage } = route.params;
  const [capturedImage, setCapturedImage] = useState(imageUri);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLang, setTargetLang] = useState(targetLanguage || 'Vietnamese');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [translatedSegments, setTranslatedSegments] = useState([]);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [renderedImageDimensions, setRenderedImageDimensions] = useState({ width: 0, height: 0 });
  const [selectedSegment, setSelectedSegment] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageRef = useRef(null);

  // Find selected language from constants
  const selectedLanguage = TARGET_LANGUAGES.find(lang => getLanguageName(lang.code) === targetLang) || TARGET_LANGUAGES[0];

  useEffect(() => {
    if (selectedSegment) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [selectedSegment]);

  // Removed auto-translation on mount
  // User needs to manually press translate button after selecting language

  const translateImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      const imageFile = {
        uri: capturedImage,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      };

      const result = await translationAPI.translateImage(imageFile, targetLang);
      setIsProcessing(false);
      setTranslatedSegments(result.segments || []);
    } catch (error) {
      setIsProcessing(false);
      console.error('Translation error:', error);
      
      let errorMessage = 'Translation failed';
      if (error.message.includes('Network Error') || error.message.includes('network')) {
        errorMessage = 'Cannot connect to server. Please check:\n1. WiFi connection\n2. Server is running\n3. Same network as server';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      Alert.alert('Translation Error', errorMessage);
    }
  };

  const onImageLoad = (event) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Image Translation</Text>
        <TouchableOpacity onPress={() => setShowLanguagePicker(true)}>
          <Text style={styles.languageBadge}>{selectedLanguage.flag}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imagePreview}>
        <Image
          ref={imageRef}
          source={{ uri: capturedImage }}
          style={styles.image}
          onLoad={onImageLoad}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setRenderedImageDimensions({ width, height });
          }}
        />

        {imageRef.current && translatedSegments.map((segment, index) => {
          if (!segment.translated || segment.original === segment.translated) {
            return null;
          }

          const { x, y, width, height } = segment.position;
          const originalImageWidth = imageDimensions.width;
          const originalImageHeight = imageDimensions.height;
          const containerWidth = renderedImageDimensions.width;
          const containerHeight = renderedImageDimensions.height;

          if (!originalImageWidth || !originalImageHeight || !containerWidth || !containerHeight) {
            return null;
          }

          const originalAspectRatio = originalImageWidth / originalImageHeight;
          const containerAspectRatio = containerWidth / containerHeight;

          let effectiveWidth, effectiveHeight, offsetX, offsetY;

          if (originalAspectRatio > containerAspectRatio) {
            effectiveWidth = containerWidth;
            effectiveHeight = containerWidth / originalAspectRatio;
            offsetX = 0;
            offsetY = (containerHeight - effectiveHeight) / 2;
          } else {
            effectiveHeight = containerHeight;
            effectiveWidth = containerHeight * originalAspectRatio;
            offsetX = (containerWidth - effectiveWidth) / 2;
            offsetY = 0;
          }

          let absX = (x / 100) * effectiveWidth + offsetX;
          let absY = (y / 100) * effectiveHeight + offsetY;
          const absWidth = (width / 100) * effectiveWidth;
          const absHeight = (height / 100) * effectiveHeight;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.detectedSegment,
                {
                  left: absX,
                  top: absY,
                  width: absWidth,
                  height: absHeight,
                },
              ]}
              onPress={() => setSelectedSegment(segment)}
            />
          );
        })}
      </View>

      {isProcessing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#5B67F5" />
          <Text style={styles.processingText}>Translating image...</Text>
        </View>
      ) : (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.translateButton]}
            onPress={translateImage}
            disabled={isProcessing}
          >
            <Ionicons name="language-outline" size={32} color="#fff" />
            <Text style={styles.actionText}>
              {translatedSegments.length > 0 ? 'Retranslate' : 'Translate'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguagePicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Target Language</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {TARGET_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    getLanguageName(lang.code) === targetLang && styles.languageOptionActive
                  ]}
                  onPress={() => {
                    setTargetLang(getLanguageName(lang.code));
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageOptionText,
                    getLanguageName(lang.code) === targetLang && styles.languageOptionTextActive
                  ]}>
                    {lang.name}
                  </Text>
                  {getLanguageName(lang.code) === targetLang && (
                    <Ionicons name="checkmark" size={24} color="#5B67F5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNavigation navigation={navigation} activeScreen="camera" />

      {/* Translation Popup */}
      {selectedSegment && (
        <Animated.View 
          style={[
            styles.translationPopup,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }
          ]}
        >
          <View style={styles.popupHeader}>
            <Text style={styles.popupTitle}>Translation</Text>
            <TouchableOpacity onPress={() => setSelectedSegment(null)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.popupScrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.popupContent}>
              <View style={styles.textSection}>
                <Text style={styles.textLabel}>Original:</Text>
                <Text style={styles.originalText}>{selectedSegment.original}</Text>
              </View>
              <View style={styles.textSection}>
                <Text style={styles.textLabel}>Translated:</Text>
                <Text style={styles.translatedText}>{selectedSegment.translated}</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ==== Header ====
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  languageBadge: {
    fontSize: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  // ==== Image Preview (phần hiển thị ảnh chụp) ====
  imagePreview: {
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#5B67F5',
    borderRadius: 16,
    overflow: 'hidden', // ✨ cắt ảnh trong khung
    backgroundColor: '#000',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // ==== Detected text segments (highlight text vùng OCR) ====
  detectedSegment: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#5B67F5',
    borderRadius: 2,
    backgroundColor: 'rgba(91, 103, 245, 0.12)',
  },

  // ==== Processing Overlay ====
  processingContainer: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  processingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },

  // ==== Actions (Translate / Retranslate buttons) ====
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B67F5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#5B67F5',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },

  // ==== Translation Popup ====
  translationPopup: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    maxHeight: 300,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#5B67F5',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(91, 103, 245, 0.3)',
  },
  popupTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  popupScrollContent: {
    maxHeight: 220,
  },
  popupContent: {
    padding: 16,
    gap: 12,
  },
  textSection: {
    gap: 4,
  },
  textLabel: {
    color: '#999',
    fontSize: 14,
  },
  originalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  translatedText: {
    color: '#5B67F5',
    fontSize: 16,
    fontWeight: '600',
  },

  // ==== Language Modal ====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionActive: {
    backgroundColor: '#f0f4ff',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 15,
  },
  languageOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  languageOptionTextActive: {
    color: '#5B67F5',
    fontWeight: 'bold',
  },
});
