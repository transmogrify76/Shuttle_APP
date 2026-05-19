import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import RazorpayWebView from '../components/RazorpayWebView';
import { createRfidRechargeOrder, verifyRfidRechargePayment } from '../services/rfidApi';

// Temporary hardcoded key – remove once backend includes razorpay_key_id
const RAZORPAY_TEST_KEY = 'rzp_test_nzmqxQYhvCH9rD';

const presetAmounts = [100, 250, 500, 1000];

export default function RfidRechargeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentRechargeId, setCurrentRechargeId] = useState(null);

  const handleAmountChange = (text) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setAmount(numeric);
  };

  const selectPreset = (value) => {
    setAmount(value.toString());
  };

  const handleCreateOrder = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount (minimum ₹1)');
      return;
    }
    setLoading(true);
    try {
      const res = await createRfidRechargeOrder(amt.toFixed(2));
      console.log('RFID order response:', JSON.stringify(res, null, 2));

      const amountInPaise = res.payment_order.amount;
      if (!amountInPaise || amountInPaise <= 0) {
        throw new Error('Invalid amount returned from server');
      }

      const orderDataForWebView = {
        key: RAZORPAY_TEST_KEY,
        amount: amountInPaise,
        currency: res.payment_order.currency,
        order_id: res.payment_order.id,
        name: 'Kolkata Shuttle RFID Recharge',
        description: `Recharge ₹${amt.toFixed(2)} for RFID wallet`,
        prefill: { email: '', contact: '', name: '' },
      };
      setOrderData(orderDataForWebView);
      setCurrentRechargeId(res.recharge.id);
      setPaymentModalVisible(true);
    } catch (err) {
      console.error('RFID order error:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      await verifyRfidRechargePayment(
        currentRechargeId,
        orderData.order_id,
        paymentData.razorpay_payment_id,
        paymentData.razorpay_signature
      );
      Alert.alert('Success', 'Recharge successful');
      setPaymentModalVisible(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
      setPaymentModalVisible(false);
    }
  };

  const handlePaymentError = (msg) => {
    Alert.alert('Payment Failed', msg);
    setPaymentModalVisible(false);
  };

  const numericAmount = parseFloat(amount) || 0;

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="RFID Recharge" />
      <View className="flex-1 justify-center px-5">
        <View className="bg-gray-900 rounded-3xl p-6 shadow-2xl">
          <Text className="text-white text-lg font-bold text-center mb-6">Add Money to RFID Wallet</Text>

          {/* Amount Input */}
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2">Enter amount (₹)</Text>
            <TextInput
              className="bg-gray-800 text-white text-3xl font-bold rounded-xl p-4 text-center"
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>

          {/* Preset Amount Chips */}
          <View className="flex-row flex-wrap justify-between mb-6">
            {presetAmounts.map((preset) => (
              <TouchableOpacity
                key={preset}
                onPress={() => selectPreset(preset)}
                className={`px-5 py-2 rounded-full border ${
                  numericAmount === preset
                    ? 'bg-white border-white'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    numericAmount === preset ? 'text-black' : 'text-white'
                  }`}
                >
                  ₹{preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Total / Fee Info */}
          <View className="flex-row justify-between items-center mb-6 pt-2 border-t border-gray-800">
            <Text className="text-gray-400 text-sm">You'll add</Text>
            <Text className="text-white text-xl font-bold">₹{numericAmount.toLocaleString('en-IN')}</Text>
          </View>

          {/* Recharge Button */}
          <TouchableOpacity
            onPress={handleCreateOrder}
            disabled={loading || numericAmount === 0}
            className={`py-4 rounded-full items-center ${loading || numericAmount === 0 ? 'bg-gray-700' : 'bg-white'}`}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-bold text-lg">Proceed to Pay</Text>
            )}
          </TouchableOpacity>

          <Text className="text-gray-500 text-xs text-center mt-4">
            Amount will be added instantly to your RFID wallet after payment.
          </Text>
        </View>
      </View>
      {orderData && (
        <RazorpayWebView
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          orderData={orderData}
        />
      )}
    </View>
  );
}