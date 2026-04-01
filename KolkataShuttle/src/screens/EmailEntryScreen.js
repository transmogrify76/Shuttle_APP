import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, RadioButton, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function EmailEntryScreen({ route, navigation }) {
  const { flow } = route.params;
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('passenger');
  const [loading, setLoading] = useState(false);
  const { sendOTP } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await sendOTP(email, flow === 'signup' ? role : null);
    setLoading(false);

    if (result.success) {
      navigation.navigate('OTPVerification', { email, flow, role: flow === 'signup' ? role : null });
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {flow === 'login' ? 'Login' : 'Create account'}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {flow === 'login'
          ? 'Enter your email to receive a login OTP'
          : 'Enter your email and role to start using Kolkata Shuttle'}
      </Text>

      <TextInput
        mode="outlined"
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        outlineColor="#ddd"
        activeOutlineColor="#000"
        textColor="#000"
      />

      {flow === 'signup' && (
        <View style={styles.roleContainer}>
          <Text variant="bodyMedium" style={styles.roleLabel}>I am a:</Text>
          <RadioButton.Group onValueChange={setRole} value={role}>
            <View style={styles.radioRow}>
              <RadioButton value="passenger" color="#000" />
              <Text style={styles.radioLabel}>Passenger</Text>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="driver" color="#000" />
              <Text style={styles.radioLabel}>Driver (Owner)</Text>
            </View>
          </RadioButton.Group>
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
        buttonColor="#000"
        labelStyle={styles.buttonLabel}
      >
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    marginTop: 40,
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  roleContainer: {
    marginVertical: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  roleLabel: {
    marginBottom: 8,
    color: '#000',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    marginLeft: 8,
    color: '#000',
  },
  button: {
    marginTop: 24,
    borderRadius: 30,
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});