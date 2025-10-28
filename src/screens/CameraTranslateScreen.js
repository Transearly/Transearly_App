import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import translationAPI from '../services/api';

export default function CameraTranslateScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLang, setTargetLang] = useState('vi');
  const cameraRef = useRef(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
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
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const translateImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      // Simulate translation - Image API not available yet
      setTimeout(() => {
        setIsProcessing(false);
        navigation.navigate('TranslationResult', {
          originalText: 'Image text (demo)',
          translatedText: 'Văn bản hình ảnh (demo)',
          sourceLang: 'en',
          targetLang: 'vi',
          imageUri: capturedImage,
        });
      }, 1500);
    } catch (error) {
      setIsProcessing(false);
      console.error('Translation error:', error);
      Alert.alert('Error', 'Feature coming soon');
    }
  };

  const retake = () => {
    setCapturedImage(null);
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

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Text Capture</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.imagePreview}>
          <Image source={{ uri: capturedImage }} style={styles.image} />
        </View>

        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#5B67F5" />
            <Text style={styles.processingText}>Translating image...</Text>
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={retake}>
              <Ionicons name="camera-outline" size={32} color="#fff" />
              <Text style={styles.actionText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.translateButton]}
              onPress={translateImage}
            >
              <Ionicons name="language-outline" size={32} color="#fff" />
              <Text style={styles.actionText}>Translate</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('TextTranslator')}
          >
            <Ionicons name="home-outline" size={28} color="#5B67F5" />
            <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('VoiceRecording')}
          >
            <Ionicons name="mic-outline" size={28} color="#999" />
            <Text style={styles.navText}>Voice</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonActive]}
          >
            <Ionicons name="camera" size={28} color="#5B67F5" />
            <Text style={[styles.navText, styles.navTextActive]}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Text Capture</Text>
          <View style={{ width: 28 }} />
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

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('TextTranslator')}
        >
          <Ionicons name="home-outline" size={28} color="#5B67F5" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('VoiceRecording')}
        >
          <Ionicons name="mic-outline" size={28} color="#999" />
          <Text style={styles.navText}>Voice</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonActive]}
        >
          <Ionicons name="camera" size={28} color="#5B67F5" />
          <Text style={[styles.navText, styles.navTextActive]}>Camera</Text>
        </TouchableOpacity>
      </View>
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
