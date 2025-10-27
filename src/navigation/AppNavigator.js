import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import VoiceRecordingScreen from '../screens/VoiceRecordingScreen';
import TranslationDiscoveryScreen from '../screens/TranslationDiscoveryScreen';
import SentenceChallengeScreen from '../screens/SentenceChallengeScreen';
import TranslationResultScreen from '../screens/TranslationResultScreen';
import TextTranslatorScreen from '../screens/TextTranslatorScreen';
import CameraTranslateScreen from '../screens/CameraTranslateScreen';
import FileUploadScreen from '../screens/FileUploadScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="TextTranslator"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            },
          }),
        }}
      >
        <Stack.Screen 
          name="TextTranslator" 
          component={TextTranslatorScreen}
        />
        <Stack.Screen 
          name="FileUpload" 
          component={FileUploadScreen}
        />
        <Stack.Screen 
          name="VoiceRecording" 
          component={VoiceRecordingScreen} 
        />
        <Stack.Screen 
          name="TranslationDiscovery" 
          component={TranslationDiscoveryScreen} 
        />
        <Stack.Screen 
          name="SentenceChallenge" 
          component={SentenceChallengeScreen} 
        />
        <Stack.Screen 
          name="TranslationResult" 
          component={TranslationResultScreen} 
        />
        <Stack.Screen
          name="TextTranslator"
          component={TextTranslatorScreen}
        />
        <Stack.Screen
          name="CameraTranslate"
          component={CameraTranslateScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
