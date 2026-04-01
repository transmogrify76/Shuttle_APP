import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import LandingScreen from '../screens/LandingScreen';
import EmailEntryScreen from '../screens/EmailEntryScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null; // or a splash screen

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="EmailEntry" component={EmailEntryScreen} />
          <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}