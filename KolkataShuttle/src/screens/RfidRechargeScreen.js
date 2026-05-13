import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import RazorpayWebView from '../components/RazorpayWebView';
import { createRfidRechargeOrder, verifyRfidRechargePayment } from '../services/rfidApi';

export default function RfidRechargeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentRechargeId, setCurrentRechargeId] = useState(null);

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

      // Ensure the backend returns amount_subunits (paise)
      const amountSubunits = res.payment_order.amount_subunits;
      if (!amountSubunits || amountSubunits <= 0) {
        throw new Error('Invalid amount_subunits returned from server');
      }

      const orderDataForWebView = {
        key: res.payment_order.razorpay_key_id,
        amount: amountSubunits,
        currency: res.payment_order.currency,
        order_id: res.payment_order.razorpay_order_id,
        name: 'Kolkata Shuttle RFID Recharge',
        description: `Recharge ₹${amt.toFixed(2)} for RFID wallet`,
        prefill: { email: '', contact: '', name: '' },
      };
      console.log('OrderData for WebView:', orderDataForWebView);
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

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="RFID Recharge" />
      <View className="flex-1 justify-center px-5">
        <View className="bg-gray-900 rounded-2xl p-5">
          <Text className="text-white text-lg font-bold mb-4">Enter amount (₹)</Text>
          <TextInput
            className="bg-gray-800 text-white rounded-xl p-4 text-lg text-center"
            keyboardType="decimal-pad"
            placeholder="e.g., 100"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity
            onPress={handleCreateOrder}
            disabled={loading}
            className={`mt-6 py-3 rounded-full items-center ${loading ? 'bg-gray-700' : 'bg-white'}`}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-bold text-lg">Proceed to Pay</Text>
            )}
          </TouchableOpacity>
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