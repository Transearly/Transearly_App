import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNavigation({ navigation, activeScreen }) {
  const navItems = [
    {
      name: 'Home',
      icon: 'home',
      activeIcon: 'home',
      screen: 'TextTranslator',
      key: 'home'
    },
    {
      name: 'Voice',
      icon: 'mic-outline',
      activeIcon: 'mic',
      screen: 'VoiceRecording',
      key: 'voice'
    },
    {
      name: 'Camera',
      icon: 'camera-outline',
      activeIcon: 'camera',
      screen: 'CameraTranslate',
      key: 'camera'
    },
    {
      name: 'File',
      icon: 'document-outline',
      activeIcon: 'document',
      screen: 'FileUpload',
      key: 'file'
    },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = activeScreen === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navButton}
            onPress={() => {
              if (!isActive) {
                navigation.navigate(item.screen);
              }
            }}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={28}
              color={isActive ? '#5B67F5' : '#999'}
            />
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
    minWidth: 60,
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
