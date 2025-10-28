import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import BottomNavigation from '../components/BottomNavigation';

const LANGUAGES = [
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
];

export default function CameraTranslateScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [targetLang, setTargetLang] = useState('Vietnamese');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const cameraRef = useRef(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        navigation.navigate('ImageTranslate', { imageUri: photo.uri, targetLanguage: targetLang });
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        navigation.navigate('ImageTranslate', { imageUri: result.assets[0].uri, targetLanguage: targetLang });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  if (!permission) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedLanguage = LANGUAGES.find(lang => lang.name === targetLang) || LANGUAGES[0];

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Text Capture</Text>
          <TouchableOpacity onPress={() => setShowLanguagePicker(true)}>
            <Text style={styles.languageBadge}>{selectedLanguage.flag}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <Text style={styles.scanText}>Position text within frame</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Ionicons name="image" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>

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
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    targetLang === lang.name && styles.languageOptionActive
                  ]}
                  onPress={() => {
                    setTargetLang(lang.name);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageOptionText,
                    targetLang === lang.name && styles.languageOptionTextActive
                  ]}>
                    {lang.name}
                  </Text>
                  {targetLang === lang.name && (
                    <Ionicons name="checkmark" size={24} color="#5B67F5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNavigation navigation={navigation} activeScreen="camera" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  languageBar: {
    alignItems: 'center',
    marginTop: 10,
  },
  languageBadge: {
    backgroundColor: 'rgba(91, 103, 245, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  languageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#5B67F5',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 100,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5B67F5',
  },
  imagePreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    position: 'relative', // Needed for absolute positioning of translated segments
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  processingContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  translateButton: {
    backgroundColor: '#5B67F5',
  },
  actionText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#5B67F5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  languageBadge: {
    fontSize: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  translatedSegment: {
    position: 'absolute',
    backgroundColor: 'rgba(91, 103, 245, 0.7)', // Semi-transparent blue background
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  translatedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
