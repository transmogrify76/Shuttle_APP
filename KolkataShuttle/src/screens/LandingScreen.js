import React from 'react';
import { View, Text } from 'react-native';
import AnimatedButton from '../components/AnimatedButton';

export default function LandingScreen({ navigation }) {
  return (
    <View className="flex-1 bg-black justify-center items-center px-6">
      <Text className="text-white text-4xl font-bold mb-2">Kolkata Shuttle</Text>
      <Text className="text-gray-400 text-base text-center mb-12">Your daily commute, simplified</Text>
      <AnimatedButton
        title="Login"
        onPress={() => navigation.navigate('EmailEntry', { flow: 'login' })}
        style={{ width: '100%', marginBottom: 12 }}
      />
      <AnimatedButton
        title="Sign Up"
        onPress={() => navigation.navigate('EmailEntry', { flow: 'signup' })}
        style={{ width: '100%', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#fff' }}
        textStyle={{ color: '#fff' }}
      />
    </View>
  );
}