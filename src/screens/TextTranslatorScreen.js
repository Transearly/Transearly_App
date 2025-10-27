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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import TranslationAPI from '../services/api';

export default function TextTranslatorScreen({ navigation }) {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [sourceLangName, setSourceLangName] = useState('English');
  const [targetLang, setTargetLang] = useState('es');
  const [targetLangName, setTargetLangName] = useState('Spanish');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      Alert.alert('Error', 'Please enter text to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const result = await TranslationAPI.translateText(
        sourceText,
        sourceLang === 'auto' ? 'auto' : sourceLang,
        targetLang
      );

      if (result.success) {
        setTranslatedText(result.data.translatedText);
        // Navigate to result screen
        navigation.navigate('TranslationResult', {
          originalText: sourceText,
          translatedText: result.data.translatedText,
          sourceLang: result.data.sourceLang,
          targetLang: result.data.targetLang,
          mode: 'text'
        });
      } else {
        Alert.alert('Error', 'Translation failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setSourceLangName(targetLangName);
    setTargetLang(sourceLang);
    setTargetLangName(sourceLangName);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
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
        <Text style={styles.title}>Text Translator</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="diamond-outline" size={24} color="#FFB800" style={styles.icon} />
          <Ionicons name="settings-outline" size={24} color="#5B67F5" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.languageSelector}>
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.languageText}>{sourceLangName}</Text>
            <Ionicons name="chevron-down" size={16} color="#5B67F5" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
            <Ionicons name="swap-horizontal" size={28} color="#5B67F5" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.languageText}>{targetLangName}</Text>
            <Ionicons name="chevron-down" size={16} color="#5B67F5" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="Type anything..."
            placeholderTextColor="#999"
            multiline
            value={sourceText}
            onChangeText={setSourceText}
          />
          <View style={styles.inputActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('VoiceRecording', { targetLang })}
            >
              <Ionicons name="mic" size={24} color="#5B67F5" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('CameraTranslate', { targetLang })}
            >
              <Ionicons name="camera" size={24} color="#5B67F5" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.translateButton, isTranslating && styles.translateButtonDisabled]}
          onPress={handleTranslate}
          disabled={isTranslating || !sourceText.trim()}
        >
          {isTranslating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.translateButtonText}>Translate</Text>
          )}
        </TouchableOpacity>

        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="lock-closed" size={32} color="#5B67F5" />
              <Ionicons name="language" size={20} color="#5B67F5" style={styles.overlayIcon} />
            </View>
            <Text style={styles.featureTitle}>Word Lock Screen</Text>
            <Text style={styles.featureDescription}>
              Translate quickly on the lock screen
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="flash" size={32} color="#5B67F5" />
              <Ionicons name="language" size={20} color="#5B67F5" style={styles.overlayIcon} />
            </View>
            <Text style={styles.featureTitle}>Quick Translate</Text>
            <Text style={styles.featureDescription}>
              Translate app instantly
            </Text>
          </View>
        </View>

        <View style={styles.featuresGrid}>
          <TouchableOpacity style={styles.smallFeatureCard}>
            <View style={styles.smallFeatureIcon}>
              <Ionicons name="book" size={28} color="#5B67F5" />
            </View>
            <Text style={styles.smallFeatureTitle}>Discover</Text>
            <Text style={styles.smallFeatureSubtitle}>Pet Translation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallFeatureCard}>
            <View style={styles.smallFeatureIcon}>
              <Ionicons name="school" size={28} color="#5B67F5" />
            </View>
            <Text style={styles.smallFeatureTitle}>Learn</Text>
            <Text style={styles.smallFeatureSubtitle}>Learn New Language</Text>
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
    </LinearGradient>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
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
  swapButton: {
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
  translateButton: {
    backgroundColor: '#5B67F5',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#5B67F5',
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
});
