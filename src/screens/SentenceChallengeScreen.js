import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SentenceChallengeScreen({ navigation }) {
  const [selectedWords, setSelectedWords] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const targetSentence = "Xin chào, Rất vui được gặp bạn";
  const answerWords = ["Hello", "Nice", "to", "meet", "you."];
  const availableWords = ["Hello", "Nice", "dinner", "to", "meet", "you.", "have", "had."];

  const handleWordPress = (word, index) => {
    setSelectedWords([...selectedWords, { word, index }]);
  };

  const handleRemoveWord = (index) => {
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
  };

  const checkAnswer = () => {
    const userAnswer = selectedWords.map(item => item.word).join(" ");
    const correctAnswer = answerWords.join(" ");
    
    if (userAnswer === correctAnswer) {
      setCorrectCount(correctCount + 1);
      setShowResult(true);
    } else {
      setWrongCount(wrongCount + 1);
      setSelectedWords([]);
    }
  };

  const nextSentence = () => {
    setShowResult(false);
    setSelectedWords([]);
    // In real app, load next sentence
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
        <Text style={styles.title}>Sentences</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="diamond-outline" size={24} color="#FFB800" style={styles.icon} />
          <Ionicons name="settings-outline" size={24} color="#5B67F5" />
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '10%' }]} />
        </View>
        <Text style={styles.progressText}>1/10</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.instructionTitle}>Translate sentences</Text>

        <View style={styles.targetCard}>
          <Text style={styles.targetText}>{targetSentence}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            <Text style={styles.wrongScore}>{wrongCount}</Text>
            {' '}
            <Text style={styles.correctScore}>{correctCount}</Text>
          </Text>
        </View>

        <View style={styles.answerArea}>
          {selectedWords.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.selectedWord}
              onPress={() => handleRemoveWord(index)}
            >
              <Text style={styles.selectedWordText}>{item.word}</Text>
            </TouchableOpacity>
          ))}
          {selectedWords.length === 0 && (
            <View style={styles.emptyAnswer}>
              <Text style={styles.emptyAnswerText}>Tap words to build sentence</Text>
            </View>
          )}
        </View>

        <View style={styles.separator} />

        <View style={styles.wordsContainer}>
          {availableWords.map((word, index) => {
            const isUsed = selectedWords.some(item => item.index === index);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.wordButton, isUsed && styles.wordButtonUsed]}
                onPress={() => !isUsed && handleWordPress(word, index)}
                disabled={isUsed}
              >
                <Text style={[styles.wordText, isUsed && styles.wordTextUsed]}>
                  {word}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedWords.length > 0 && !showResult && (
          <TouchableOpacity
            style={styles.checkButton}
            onPress={checkAnswer}
          >
            <Text style={styles.checkButtonText}>Check Answer</Text>
          </TouchableOpacity>
        )}

        {showResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>🤩</Text>
            <Text style={styles.resultTitle}>EXCELLENT</Text>
            <Text style={styles.resultAnswer}>
              {selectedWords.map(item => item.word).join(" ")}
            </Text>
            <TouchableOpacity style={styles.audioButton}>
              <Ionicons name="volume-high" size={24} color="#5B67F5" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={nextSentence}
            >
              <Text style={styles.nextButtonText}>Next Sentence</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Re-Learning</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Annotate Words</Text>
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 15,
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
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5B67F5',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'right',
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  targetCard: {
    backgroundColor: '#E8ECFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  targetText: {
    fontSize: 18,
    color: '#5B67F5',
    fontWeight: '500',
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 18,
  },
  wrongScore: {
    color: '#FF5B67',
    fontWeight: '700',
  },
  correctScore: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  answerArea: {
    minHeight: 80,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  emptyAnswer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAnswerText: {
    color: '#999',
    fontSize: 14,
  },
  selectedWord: {
    backgroundColor: '#5B67F5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    margin: 5,
  },
  selectedWordText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  wordButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
    borderWidth: 2,
    borderColor: '#5B67F5',
  },
  wordButtonUsed: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  wordText: {
    color: '#5B67F5',
    fontSize: 16,
    fontWeight: '500',
  },
  wordTextUsed: {
    color: '#CCCCCC',
  },
  checkButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 15,
  },
  resultAnswer: {
    fontSize: 18,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 15,
  },
  audioButton: {
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#5B67F5',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F2FF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#5B67F5',
    fontSize: 16,
    fontWeight: '600',
  },
});
