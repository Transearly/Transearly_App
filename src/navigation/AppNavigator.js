import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TextTranslatorScreen from '../screens/TextTranslatorScreen';
import CameraTranslateScreen from '../screens/CameraTranslateScreen';
import FileUploadScreen from '../screens/FileUploadScreen';
import VoiceRecordingScreen from '../screens/VoiceRecordingScreen';
import TranslationResultScreen from '../screens/TranslationResultScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="TextTranslator">
        <Stack.Screen 
          name="TextTranslator" 
          component={TextTranslatorScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="FileUpload" 
          component={FileUploadScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CameraTranslate" 
          component={CameraTranslateScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="VoiceRecording" 
          component={VoiceRecordingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TranslationResult" 
          component={TranslationResultScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
