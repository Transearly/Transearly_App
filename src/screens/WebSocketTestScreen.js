import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import translationAPI from '../services/api';

export default function WebSocketTestScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    // Check connection status every 3 seconds
    const interval = setInterval(() => {
      checkConnectionStatus();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const checkConnectionStatus = () => {
    if (translationAPI.socket) {
      setIsConnected(true);
      setSocketId(translationAPI.socketId);
      addLog('Socket connected', `ID: ${translationAPI.socketId}`);
    } else {
      setIsConnected(false);
      setSocketId(null);
      addLog('Socket disconnected');
    }
  };

  const addLog = (message) => {
    setLogs(prev => [...prev, { timestamp: new Date().toISOString(), message }]);
  };

  const testConnection = async () => {
    addLog('Testing WebSocket connection...');
    try {
      await translationAPI.initializeWebSocket();
      addLog('WebSocket initialized successfully');
      setIsConnected(true);
      setSocketId(translationAPI.socketId);
    } catch (error) {
      addLog(`WebSocket connection failed: ${error.message}`);
      setIsConnected(false);
      setSocketId(null);
    }
  };

  const testUpload = async () => {
    if (!translationAPI.socketId) {
      addLog('No socket ID, cannot test upload');
      Alert.alert('Error', 'Please connect to WebSocket first');
      return;
    }

    addLog('Testing file upload...');
    try {
      // Create a test file
      const testFile = {
        uri: 'file:///test.txt',
        type: 'text/plain',
        name: 'test.txt',
        size: 1024,
      };

      const response = await translationAPI.uploadFileForTranslation(testFile);
      addLog(`Upload response: ${JSON.stringify(response)}`);
      addLog(`Job ID: ${response.data?.jobId || 'No ID'}`);
    } catch (error) {
      addLog(`Upload failed: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
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
        <Text style={styles.title}>WebSocket Test</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, isConnected && styles.statusConnected]}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
          <Text style={styles.socketId}>
            ID: {socketId || 'None'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Test</Text>
          <TouchableOpacity
            style={[styles.button, isConnected && styles.buttonConnected]}
            onPress={testConnection}
            disabled={!isConnected}
          >
            <Ionicons name="wifi" size={20} color="#fff" />
            <Text style={styles.buttonText}>Test Connection</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Test</Text>
          <TouchableOpacity
            style={[styles.button, isConnected && styles.buttonConnected]}
            onPress={testUpload}
            disabled={!isConnected}
          >
            <Ionicons name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.buttonText}>Test Upload</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={clearLogs}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.buttonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logContainer}>
          <ScrollView style={styles.logScroll}>
            {logs.map((log, index) => (
              <View key={index} style={styles.logItem}>
                <Text style={styles.logTime}>{log.timestamp}</Text>
                <Text style={styles.logMessage}>{log.message}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#999',
  },
  statusConnected: {
    fontSize: 16,
    color: '#4CAF50',
    },
  socketId: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#5B67F5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonConnected: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
  },
  logScroll: {
    flex: 1,
  },
  logItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 5,
  },
  logTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  logMessage: {
    fontSize: 14,
    color: '#333',
  },
});