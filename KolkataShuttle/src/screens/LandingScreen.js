import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function LandingScreen({ navigation }) {
  const { loading } = useAuth();

  if (loading) return null; // or a spinner

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Kolkata Shuttle</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>Your daily commute, simplified</Text>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('EmailEntry', { flow: 'login' })}
          style={styles.button}
          buttonColor="#000"
          labelStyle={styles.buttonLabel}
        >
          Login
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('EmailEntry', { flow: 'signup' })}
          style={styles.buttonOutline}
          labelStyle={styles.buttonOutlineLabel}
        >
          Sign Up
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 24,
  },
  button: {
    marginBottom: 16,
    borderRadius: 30,
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutline: {
    borderColor: '#000',
    borderRadius: 30,
    paddingVertical: 4,
  },
  buttonOutlineLabel: {
    color: '#000',
  },
});