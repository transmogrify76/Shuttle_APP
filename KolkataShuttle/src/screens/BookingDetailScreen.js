import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Modal,
  TextInput, ActivityIndicator, Share, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import Header from '../components/Header';
import AnimatedButton from '../components/AnimatedButton';
import {
  getBookingDetail,
  cancelBooking,
  getBookingQR,
  createRating,
  getBookingRating,
} from '../services/bookingApi';

const { width } = Dimensions.get('window');

const StatusHeader = ({ status, onCancel, cancelling, canCancel }) => {
  let statusColor, statusIcon, statusText;
  switch (status) {
    case 'booked':
      statusColor = '#10b981';
      statusIcon = 'checkmark-circle';
      statusText = 'Confirmed';
      break;
    case 'pending_payment':
      statusColor = '#f59e0b';
      statusIcon = 'time';
      statusText = 'Pending Payment';
      break;
    case 'completed':
      statusColor = '#3b82f6';
      statusIcon = 'checkmark-done';
      statusText = 'Completed';
      break;
    case 'cancelled':
      statusColor = '#ef4444';
      statusIcon = 'close-circle';
      statusText = 'Cancelled';
      break;
    default:
      statusColor = '#6b7280';
      statusIcon = 'help-circle';
      statusText = status;
  }
  return (
    <LinearGradient
      colors={['#1a1a1a', '#0d0d0d']}
      className="rounded-2xl p-4 mb-4"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center mr-3">
            <Ionicons name={statusIcon} size={20} color={statusColor} />
          </View>
          <View>
            <Text className="text-gray-400 text-xs">Booking Status</Text>
            <Text className="text-white text-xl font-bold">{statusText}</Text>
          </View>
        </View>
        {canCancel && !cancelling && (
          <TouchableOpacity onPress={onCancel} className="bg-red-500/20 px-3 py-2 rounded-full">
            <Text className="text-red-400 text-sm font-semibold">Cancel</Text>
          </TouchableOpacity>
        )}
        {cancelling && <ActivityIndicator size="small" color="#ef4444" />}
      </View>
    </LinearGradient>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <View className="flex-row items-center py-2">
    <Ionicons name={icon} size={20} color="#aaa" style={{ width: 24 }} />
    <Text className="text-gray-400 text-sm ml-3 flex-1">{label}</Text>
    <Text className="text-white text-sm font-medium">{value || '—'}</Text>
  </View>
);

const StopRow = ({ stop, isFirst, isLast }) => (
  <View className="flex-row items-center">
    <View className="items-center mr-3">
      <View className={`w-3 h-3 rounded-full ${isFirst ? 'bg-green-500' : isLast ? 'bg-red-500' : 'bg-gray-600'}`} />
      {!isLast && <View className="w-0.5 h-8 bg-gray-700 mt-1" />}
    </View>
    <Text className={`text-white text-base ${isFirst ? 'font-bold' : ''}`}>{stop}</Text>
  </View>
);

export default function BookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [tripRating, setTripRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const bookingData = await getBookingDetail(bookingId);
      setBooking(bookingData);
      if (bookingData.booking_status === 'booked') {
        const qr = await getBookingQR(bookingId);
        setQrData(qr);
      }
      try {
        const rating = await getBookingRating(bookingId);
        setExistingRating(rating);
      } catch (e) {}
    } catch (error) {
      Alert.alert('Error', error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelBooking(bookingId);
              Alert.alert('Cancelled', 'Your booking has been cancelled.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleShareQR = async () => {
    if (qrData?.qr_token) {
      try {
        await Share.share({ message: qrData.qr_token });
      } catch (e) {
        Alert.alert('Error', 'Could not share QR');
      }
    }
  };

  const handleSubmitRating = async () => {
    setSubmittingRating(true);
    try {
      await createRating(bookingId, {
        trip_rating: tripRating,
        driver_rating: driverRating,
        review_text: reviewText,
      });
      Alert.alert('Thank you!', 'Your rating has been submitted.');
      setRatingModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const canCancel = booking?.booking_status === 'booked' || booking?.booking_status === 'pending_payment';
  const canRate = booking?.booking_status === 'completed' && !existingRating;
  const pickupName = booking?.pickup_stop?.stop?.name || 'Pickup';
  const dropoffName = booking?.dropoff_stop?.stop?.name || 'Dropoff';

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Booking Details" />
      <ScrollView className="flex-1 px-4 pt-4">
        <StatusHeader
          status={booking?.booking_status}
          onCancel={handleCancel}
          cancelling={cancelling}
          canCancel={canCancel}
        />

        {/* Route Visualization */}
        <LinearGradient
          colors={['#1a1a1a', '#0d0d0d']}
          className="rounded-2xl p-4 mb-4"
        >
          <Text className="text-white text-lg font-bold mb-3">Your Trip</Text>
          <StopRow stop={pickupName} isFirst />
          <StopRow stop={dropoffName} isLast />
        </LinearGradient>

        {/* Trip Details */}
        <LinearGradient
          colors={['#1a1a1a', '#0d0d0d']}
          className="rounded-2xl p-4 mb-4"
        >
          <Text className="text-white text-lg font-bold mb-3">Trip Details</Text>
          <InfoRow icon="calendar-outline" label="Date" value={new Date(booking?.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
          <InfoRow icon="time-outline" label="Time" value={new Date(booking?.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} />
          <InfoRow icon="cash-outline" label="Fare" value={`₹${booking?.fare_amount}`} />
          <InfoRow icon="bus-outline" label="Seats" value={booking?.seats?.join(', ') || '—'} />
          <InfoRow icon="card-outline" label="Payment" value={booking?.payments?.[0]?.payment_status === 'captured' ? 'Paid' : 'Pending'} />
        </LinearGradient>

        {/* QR Code */}
        {qrData && (
          <LinearGradient
            colors={['#1a1a1a', '#0d0d0d']}
            className="rounded-2xl p-4 mb-4 items-center"
          >
            <Text className="text-white text-lg font-bold mb-3">Boarding Pass</Text>
            <View className="bg-white p-4 rounded-xl">
              <QRCode value={qrData.qr_token} size={width * 0.5} color="black" backgroundColor="white" />
            </View>
            <TouchableOpacity
              onPress={handleShareQR}
              className="mt-4 flex-row items-center bg-gray-800 rounded-full px-4 py-2"
            >
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text className="text-white ml-2">Share QR</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* Rating */}
        {canRate && (
          <TouchableOpacity
            onPress={() => setRatingModalVisible(true)}
            className="bg-gray-900 rounded-2xl p-4 mb-4 items-center flex-row justify-center"
          >
            <Ionicons name="star-outline" size={24} color="#fbbf24" />
            <Text className="text-white ml-2 font-semibold">Rate your trip</Text>
          </TouchableOpacity>
        )}

        {existingRating && (
          <LinearGradient
            colors={['#1a1a1a', '#0d0d0d']}
            className="rounded-2xl p-4 mb-4"
          >
            <Text className="text-white text-lg font-bold mb-2">Your Rating</Text>
            <View className="flex-row items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < existingRating.trip_rating ? 'star' : 'star-outline'}
                  size={20}
                  color="#fbbf24"
                />
              ))}
              <Text className="text-white ml-2">Trip</Text>
            </View>
            <View className="flex-row items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < existingRating.driver_rating ? 'star' : 'star-outline'}
                  size={20}
                  color="#fbbf24"
                />
              ))}
              <Text className="text-white ml-2">Driver</Text>
            </View>
            <Text className="text-gray-400 mt-2">{existingRating.review_text}</Text>
          </LinearGradient>
        )}
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-center items-center p-5">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-xl font-bold mb-4">Rate your trip</Text>

            <Text className="font-medium mb-1">Trip rating</Text>
            <View className="flex-row justify-center mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setTripRating(star)}>
                  <Ionicons
                    name={star <= tripRating ? 'star' : 'star-outline'}
                    size={32}
                    color="#fbbf24"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text className="font-medium mb-1">Driver rating</Text>
            <View className="flex-row justify-center mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setDriverRating(star)}>
                  <Ionicons
                    name={star <= driverRating ? 'star' : 'star-outline'}
                    size={32}
                    color="#fbbf24"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              className="border border-gray-300 rounded-xl p-3 mb-4"
              placeholder="Write a review (optional)"
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={3}
            />

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setRatingModalVisible(false)}
                className="px-6 py-2 rounded-full bg-gray-200"
              >
                <Text className="text-black">Cancel</Text>
              </TouchableOpacity>
              <AnimatedButton
                title={submittingRating ? 'Submitting...' : 'Submit'}
                onPress={handleSubmitRating}
                disabled={submittingRating}
                style={{ width: 100 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}