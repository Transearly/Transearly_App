import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function VoiceRecordingScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const startRecording = () => {
    setIsRecording(true);
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

    // Simulate recording for 2 seconds then show result
    setTimeout(() => {
      stopRecording();
    }, 2000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    pulseAnim.setValue(1);
    // Navigate to result screen after recording
    setTimeout(() => {
      navigation.navigate('TranslationResult');
    }, 500);
  };

  return (
    <LinearGradient
      colors={['#f0f4ff', '#e8f5f0']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Translation</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="diamond-outline" size={24} color="#FFB800" style={styles.icon} />
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#5B67F5" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.languageSelector}>
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageText}>Human 👤</Text>
          <Ionicons name="chevron-down" size={16} color="#5B67F5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.swapButton}>
          <Ionicons name="swap-horizontal" size={24} color="#5B67F5" />
        </TouchableOpacity>
      </View>

      <View style={styles.recordingArea}>
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
        >
          <Ionicons
            name={isRecording ? "square" : "mic"}
            size={40}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.instructionText}>
          {isRecording ? "Recording..." : "Tap And Hold\nTo Record"}
        </Text>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={28} color="#5B67F5" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('TranslationDiscovery')}
        >
          <Ionicons name="compass-outline" size={28} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('TextTranslator')}
        >
          <Ionicons name="text-outline" size={28} color="#999" />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
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
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 50,
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
    color: '#333',
    marginRight: 8,
  },
  swapButton: {
    marginLeft: 20,
    padding: 10,
  },
  recordingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#5B67F5',
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#5B67F5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#5B67F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordingButton: {
    backgroundColor: '#FF5B67',
  },
  instructionText: {
    marginTop: 30,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
