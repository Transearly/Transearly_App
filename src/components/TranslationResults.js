import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const TranslationResults = ({ segments, isLandscape }) => {
  return (
    <View style={[
      styles.container,
      isLandscape ? styles.landscapeContainer : styles.portraitContainer
    ]}>
      <ScrollView style={styles.scrollView}>
        {segments.map((segment, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.originalText}>{segment.original}</Text>
            <Text style={styles.translatedText}>{segment.translated}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 10,
  },
  landscapeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: screenWidth * 0.3,
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: '#333',
  },
  portraitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  scrollView: {
    padding: 10,
  },
  resultItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
  },
  originalText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5,
  },
  translatedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TranslationResults;