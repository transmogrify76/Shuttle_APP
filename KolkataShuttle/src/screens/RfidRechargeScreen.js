import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import RazorpayWebView from '../components/RazorpayWebView';
import { createRfidRechargeOrder, verifyRfidRechargePayment } from '../services/rfidApi';
import { C, T } from '../styles/design';

const RAZORPAY_TEST_KEY = 'rzp_test_nzmqxQYhvCH9rD';
const presetAmounts = [100, 250, 500, 1000];

export default function RfidRechargeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentRechargeId, setCurrentRechargeId] = useState(null);

  const handleAmountChange = (text) => setAmount(text.replace(/[^0-9]/g, ''));
  const selectPreset = (value) => setAmount(value.toString());

  const handleCreateOrder = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount (minimum ₹1)');
      return;
    }
    setLoading(true);
    try {
      const res = await createRfidRechargeOrder(amt.toFixed(2));
      const amountInPaise = res.payment_order.amount;
      if (!amountInPaise || amountInPaise <= 0) throw new Error('Invalid amount returned');
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
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      await verifyRfidRechargePayment(currentRechargeId, orderData.order_id, paymentData.razorpay_payment_id, paymentData.razorpay_signature);
      Alert.alert('Success', 'Recharge successful');
      setPaymentModalVisible(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
      setPaymentModalVisible(false);
    }
  };
  const handlePaymentError = (msg) => { Alert.alert('Payment Failed', msg); setPaymentModalVisible(false); };

  const numericAmount = parseFloat(amount) || 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="RFID Recharge" />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
        <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 28, padding: 24, borderWidth: 1, borderColor: C.border }}>
          <Text style={[T.displayMd, { textAlign: 'center', marginBottom: 24 }]}>Add Money to RFID Wallet</Text>

          <View style={{ marginBottom: 24 }}>
            <Text style={[T.headingSm, { marginBottom: 8 }]}>Enter amount (₹)</Text>
            <TextInput
              style={{ backgroundColor: C.surfaceHigh, borderRadius: 20, padding: 16, fontSize: 28, fontWeight: 'bold', color: C.textPrimary, textAlign: 'center' }}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={C.textMuted}
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24, gap: 8 }}>
            {presetAmounts.map(preset => (
              <TouchableOpacity key={preset} onPress={() => selectPreset(preset)} style={{ backgroundColor: numericAmount === preset ? C.gold : C.surfaceHigh, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 30, borderWidth: 1, borderColor: numericAmount === preset ? C.gold : C.border }}>
                <Text style={{ fontWeight: '600', color: numericAmount === preset ? '#000' : C.textPrimary }}>₹{preset}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border }}>
            <Text style={[T.bodySm, { color: C.textMuted }]}>You'll add</Text>
            <Text style={[T.displayMd, { color: C.gold }]}>₹{numericAmount.toLocaleString('en-IN')}</Text>
          </View>

          <TouchableOpacity onPress={handleCreateOrder} disabled={loading || numericAmount === 0} style={{ backgroundColor: loading || numericAmount === 0 ? C.surfaceHigh : C.gold, borderRadius: 30, paddingVertical: 14, alignItems: 'center', marginTop: 16 }}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Proceed to Pay</Text>}
          </TouchableOpacity>
          <Text style={[T.bodySm, { color: C.textMuted, textAlign: 'center', marginTop: 16 }]}>Amount will be added instantly to your RFID wallet after payment.</Text>
        </LinearGradient>
      </View>
      {orderData && <RazorpayWebView visible={paymentModalVisible} onClose={() => setPaymentModalVisible(false)} onSuccess={handlePaymentSuccess} onError={handlePaymentError} orderData={orderData} />}
    </View>
  );
}