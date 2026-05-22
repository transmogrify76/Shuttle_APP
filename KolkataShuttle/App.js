import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { SeatmapProvider } from './src/context/SeatmapContext';
import AppNavigator from './src/navigation/AppNavigator';
import { darkTheme } from './src/styles/theme';

// Global error handler to catch React render errors
if (typeof ErrorUtils !== 'undefined') {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('GLOBAL ERROR:', error);
    console.error(error.stack);
    // Show an alert with the error message and stack (only during development)
    alert(error.message + '\n\n' + error.stack);
  });
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={darkTheme}>
        <AuthProvider>
          <SeatmapProvider>
            <NotificationProvider>
              <NavigationContainer>
                <StatusBar style="light" />
                <AppNavigator />
              </NavigationContainer>
            </NotificationProvider>
          </SeatmapProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}