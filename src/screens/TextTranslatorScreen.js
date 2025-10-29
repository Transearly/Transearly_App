import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import translationAPI from '../services/api';
import BottomNavigation from '../components/BottomNavigation';
import { SOURCE_LANGUAGES, TARGET_LANGUAGES, getLanguageName } from '../constants/languages';

export default function TextTranslatorScreen({ navigation }) {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('vi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Hàm xử lý dịch text dưới dạng file
  const handleTranslateAsFile = async () => {
    if (!sourceText.trim()) {
      Alert.alert('Error', 'Please enter text to translate');
      return;
    }

    setIsTranslating(true);
    try {
      // Tạo đối tượng file từ text
      const file = {
        uri: 'text_to_translate.txt',
        type: 'text/plain',
        name: 'text_to_translate.txt',
        content: sourceText
      };

      // Gọi API upload file
      const response = await translationAPI.uploadFileForTranslation(
        file,
        targetLang,
        false // isUserPremium = false
      );

      if (response && response.jobId) {
        Alert.alert(
          'Success',
          'Your text has been uploaded for translation. Check translation status in the app.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Có thể navigate đến màn hình theo dõi tiến trình nếu có
                setIsTranslating(false);
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Translation failed');
      setIsTranslating(false);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      Alert.alert('Error', 'Please enter text to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const targetLanguageName = getLanguageName(targetLang);

      console.log('Calling translation API with:', {
        text: sourceText.substring(0, 50) + '...',
        targetLanguage: targetLanguageName
      });

      // Call the real translation API (AI auto-detects source language)
      const result = await translationAPI.translateText(
        sourceText,
        targetLanguageName
      );

      console.log('Translation API result:', result);

      if (!result || !result.translatedText) {
        throw new Error('No translation result received from server');
      }

      setTranslatedText(result.translatedText);
      setIsTranslating(false);
      setShowResult(true); // Show result inline instead of navigating
    } catch (error) {
      setIsTranslating(false);
      console.error('Translation error:', error);

      // More detailed error message
      let errorMessage = 'Translation failed';
      if (error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please check:\n1. WiFi connection\n2. Server is running\n3. Same network as server';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }

      Alert.alert('Translation Error', errorMessage);
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setSourceText('');
    setTranslatedText('');
  };

  const handleCopyText = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: '#f0f4ff' }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.title}>Text Translator</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="diamond-outline" size={24} color="#FFB800" style={styles.icon} />
            <Ionicons name="settings-outline" size={24} color="#5B67F5" />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={28} color="#5B67F5" />
            </View>

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
                  <Text style={styles.languageLabel}>
                    ({SOURCE_LANGUAGES.find(l => l.code === sourceLang)?.name})
                  </Text>
                </View>
                <ScrollView 
                  style={styles.resultTextContainer}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.resultText}>{sourceText}</Text>
                </ScrollView>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopyText(sourceText, 'Original text')}
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
                  <Text style={[styles.languageLabel, { color: '#fff', opacity: 0.7 }]}>
                    ({TARGET_LANGUAGES.find(l => l.code === targetLang)?.name})
                  </Text>
                </View>
                <ScrollView 
                  style={styles.resultTextContainer}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.translatedText}>{translatedText}</Text>
                </ScrollView>
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
                <Text style={styles.tryAgainText}>Translate Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type anything..."
                  placeholderTextColor="#999"
                  multiline
                  value={sourceText}
                  onChangeText={setSourceText}
                />
              </View>

              <TouchableOpacity
                style={[styles.translateButton, isTranslating && styles.translateButtonDisabled]}
                onPress={handleTranslate}
                disabled={isTranslating || !sourceText.trim()}
              >
                {isTranslating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.translateButtonText}>Translate Text</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.methodsGrid}>
            <TouchableOpacity 
              style={styles.methodCard}
              onPress={() => navigation.navigate('FileUpload')}
            >
              <View style={styles.methodIconContainer}>
                <Ionicons name="document-text" size={32} color="#5B67F5" />
              </View>
              <Text style={styles.methodTitle}>File</Text>
              <Text style={styles.methodDescription}>PDF, DOCX, TXT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.methodCard}
              onPress={() => navigation.navigate('CameraTranslate')}
            >
              <View style={styles.methodIconContainer}>
                <Ionicons name="camera" size={32} color="#5B67F5" />
              </View>
              <Text style={styles.methodTitle}>Image</Text>
              <Text style={styles.methodDescription}>Photo, Screenshot</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.methodCard}
              onPress={() => navigation.navigate('VoiceRecording')}
            >
              <View style={styles.methodIconContainer}>
                <Ionicons name="mic" size={32} color="#5B67F5" />
              </View>
              <Text style={styles.methodTitle}>Voice</Text>
              <Text style={styles.methodDescription}>Speech to Text</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.methodCard}
              onPress={() => navigation.navigate('ScreenTranslate')}
            >
              <View style={styles.methodIconContainer}>
                <Ionicons name="phone-portrait" size={32} color="#5B67F5" />
              </View>
              <Text style={styles.methodTitle}>Screen</Text>
              <Text style={styles.methodDescription}>Live Translation</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.lockScreenPreview}>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Translate Lock Screen</Text>
              <Text style={styles.previewSubtitle}>
                Quick translation on the lock screen
              </Text>
              <View style={styles.previewImage}>
                <View style={styles.previewPhone}>
                  <Text style={styles.previewTime}>09:47</Text>
                  <Text style={styles.previewDate}>Sunday</Text>
                </View>
                <TouchableOpacity style={styles.turnOnButton}>
                  <Text style={styles.turnOnButtonText}>Turn on</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.decorations}>
            <Text style={styles.decorEmoji}>📚</Text>
            <Text style={styles.decorEmoji}>🎓</Text>
          </View>
        </ScrollView>

        {/* Source Language Picker Modal */}
        <Modal
          visible={showSourcePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSourcePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSourcePicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Source Language</Text>
                <TouchableOpacity onPress={() => setShowSourcePicker(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {SOURCE_LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      sourceLang === lang.code && styles.languageOptionActive
                    ]}
                    onPress={() => {
                      setSourceLang(lang.code);
                      setShowSourcePicker(false);
                    }}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={[
                      styles.languageOptionText,
                      sourceLang === lang.code && styles.languageOptionTextActive
                    ]}>
                      {lang.name}
                    </Text>
                    {sourceLang === lang.code && (
                      <Ionicons name="checkmark" size={24} color="#5B67F5" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Target Language Picker Modal */}
        <Modal
          visible={showTargetPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTargetPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTargetPicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Target Language</Text>
                <TouchableOpacity onPress={() => setShowTargetPicker(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {TARGET_LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      targetLang === lang.code && styles.languageOptionActive
                    ]}
                    onPress={() => {
                      setTargetLang(lang.code);
                      setShowTargetPicker(false);
                    }}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={[
                      styles.languageOptionText,
                      targetLang === lang.code && styles.languageOptionTextActive
                    ]}>
                      {lang.name}
                    </Text>
                    {targetLang === lang.code && (
                      <Ionicons name="checkmark" size={24} color="#5B67F5" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <BottomNavigation navigation={navigation} activeScreen="home" />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {
    width: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    justifyContent: 'flex-end',
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  languageText: {
    fontSize: 16,
    color: '#5B67F5',
    fontWeight: '600',
    marginRight: 8,
  },
  arrowContainer: {
    padding: 10,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    minHeight: 150,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    marginLeft: 15,
    padding: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  translateButton: {
    flex: 1,
    backgroundColor: '#5B67F5',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#5B67F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fileTranslateButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  translateButtonDisabled: {
    opacity: 0.6,
  },
  translateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#F0F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  overlayIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 11,
    color: '#999',
    lineHeight: 16,
  },
  smallFeatureCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  smallFeatureIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F0F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  smallFeatureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  smallFeatureSubtitle: {
    fontSize: 11,
    color: '#999',
  },
  lockScreenPreview: {
    marginTop: 10,
    marginBottom: 20,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  previewImage: {
    alignItems: 'center',
  },
  previewPhone: {
    width: 150,
    height: 200,
    backgroundColor: '#E8ECFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  previewTime: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  previewDate: {
    fontSize: 14,
    color: '#666',
  },
  turnOnButton: {
    backgroundColor: '#5B67F5',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  turnOnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  decorations: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 40,
  },
  decorEmoji: {
    fontSize: 40,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionActive: {
    backgroundColor: '#f0f4ff',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 15,
  },
  languageOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  languageOptionTextActive: {
    fontWeight: 'bold',
    color: '#5B67F5',
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '48%',
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  methodIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#F0F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  methodDescription: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  resultContainer: {
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  resultTextContainer: {
    maxHeight: 150,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  translatedText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 28,
  },
  tryAgainButton: {
    flexDirection: 'row',
    backgroundColor: '#5B67F5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    alignSelf: 'center',
    elevation: 5,
    shadowColor: '#5B67F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tryAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
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
