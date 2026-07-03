import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';

import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { SeatmapProvider } from './src/context/SeatmapContext';
import { ApiRefreshProvider } from './src/context/ApiRefreshContext';
import AppNavigator from './src/navigation/AppNavigator';
import { darkTheme } from './src/styles/theme';
import { YellowBox, LogBox } from 'react-native';
LogBox.ignoreAllLogs();


if (typeof ErrorUtils !== 'undefined') {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('GLOBAL ERROR:', error);
    console.error(error.stack);
    alert(error.message + '\n\n' + error.stack);
  });
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="light" />

      <PaperProvider theme={darkTheme}>
        <AuthProvider>
          <SeatmapProvider>
            <NotificationProvider>
              <ApiRefreshProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </ApiRefreshProvider>
            </NotificationProvider>
          </SeatmapProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}