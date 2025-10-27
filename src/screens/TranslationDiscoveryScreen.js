import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function TranslationDiscoveryScreen({ navigation }) {
  return (
    <LinearGradient
      colors={['#f0f4ff', '#e8f5f0']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Translation Discovery</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="diamond-outline" size={24} color="#FFB800" style={styles.icon} />
          <Ionicons name="settings-outline" size={24} color="#5B67F5" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Cry baby</Text>
            <Text style={styles.categorySubtitle}>Translate for children</Text>
          </View>
          <TouchableOpacity
            style={styles.translateButton}
            onPress={() => navigation.navigate('SentenceChallenge')}
          >
            <Text style={styles.translateButtonText}>Translate now</Text>
          </TouchableOpacity>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>👶</Text>
          </View>
        </View>

        <View style={[styles.categoryCard, styles.petCard]}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Pet Translation</Text>
            <Text style={styles.categorySubtitle}>Translation for cats and dogs</Text>
          </View>
          <TouchableOpacity style={styles.translateButton}>
            <Text style={styles.translateButtonText}>Translate now</Text>
          </TouchableOpacity>
          <View style={styles.petEmojis}>
            <Text style={styles.emoji}>😺</Text>
            <Text style={styles.emoji}>🐕</Text>
          </View>
        </View>

        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="book-outline" size={32} color="#5B67F5" />
            </View>
            <Text style={styles.featureTitle}>Discover</Text>
            <Text style={styles.featureSubtitle}>Pet Translation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="school-outline" size={32} color="#5B67F5" />
            </View>
            <Text style={styles.featureTitle}>Learn</Text>
            <Text style={styles.featureSubtitle}>Learn New Language</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.decorations}>
          <Text style={styles.decorEmoji}>🌙</Text>
          <Text style={styles.decorEmoji}>⭐</Text>
          <Text style={styles.decorEmoji}>🍪</Text>
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
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 25,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  petCard: {
    backgroundColor: '#FFF9E6',
  },
  categoryHeader: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  categorySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  translateButton: {
    backgroundColor: '#5B67F5',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  translateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emojiContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  emoji: {
    fontSize: 60,
  },
  petEmojis: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#F0F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#999',
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
