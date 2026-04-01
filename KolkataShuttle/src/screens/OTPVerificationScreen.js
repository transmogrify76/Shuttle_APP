import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function OTPVerificationScreen({ route }) {
  const { email, flow, role } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    let result;
    if (flow === 'signup') {
      result = await signup(email, otpString, role);
    } else {
      result = await login(email, otpString);
    }
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error);
    }
    // If success, the auth state updates and AppNavigator will automatically switch to the authenticated stack.
    // No manual navigation needed.
  };

  const resendOTP = async () => {
    // Implement resend OTP logic if needed
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Enter OTP</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        We've sent a 6-digit code to {email}
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.otpInput}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            mode="outlined"
            outlineColor="#ddd"
            activeOutlineColor="#000"
            textColor="#000"
          />
        ))}
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
        buttonColor="#000"
        labelStyle={styles.buttonLabel}
      >
        Verify
      </Button>

      <Button
        mode="text"
        onPress={resendOTP}
        style={styles.resendButton}
        labelStyle={styles.resendLabel}
      >
        Resend OTP
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
    marginBottom: 32,
    color: '#666',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  button: {
    borderRadius: 30,
    paddingVertical: 4,
    marginBottom: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignSelf: 'center',
  },
  resendLabel: {
    color: '#666',
  },
});