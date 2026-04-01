import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Modal,
  TextInput, ActivityIndicator, Share
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

      // If status is booked, fetch QR
      if (bookingData.booking_status === 'booked') {
        const qr = await getBookingQR(bookingId);
        setQrData(qr);
      }

      // Check if rating exists
      try {
        const rating = await getBookingRating(bookingId);
        setExistingRating(rating);
      } catch (e) {
        // No rating yet
      }
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
      loadData(); // refresh to show rating
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

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Booking Details" />
      <ScrollView className="flex-1 px-5 pt-5">
        {/* Status */}
        <View className="bg-gray-900 rounded-2xl p-4 mb-4">
          <Text className="text-white text-sm">Status</Text>
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-white text-2xl font-bold capitalize">
              {booking?.booking_status?.replace('_', ' ')}
            </Text>
            {canCancel && !cancelling && (
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close-circle-outline" size={28} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
          {cancelling && <ActivityIndicator size="small" color="#ef4444" className="mt-2" />}
        </View>

        {/* Trip info */}
        <View className="bg-gray-900 rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-bold mb-2">Trip Details</Text>
          <View className="flex-row items-center mb-3">
            <Ionicons name="bus" size={20} color="#aaa" />
            <Text className="text-gray-300 ml-3">{booking?.pickup_stop?.stop?.name} → {booking?.dropoff_stop?.stop?.name}</Text>
          </View>
          <View className="flex-row items-center mb-3">
            <Ionicons name="cash" size={20} color="#aaa" />
            <Text className="text-gray-300 ml-3">₹{booking?.fare_amount}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={20} color="#aaa" />
            <Text className="text-gray-300 ml-3">{new Date(booking?.created_at).toLocaleString()}</Text>
          </View>
        </View>

        {/* QR Code (if booked) */}
        {qrData && (
          <View className="bg-gray-900 rounded-2xl p-4 mb-4 items-center">
            <Text className="text-white text-lg font-bold mb-3">Boarding Pass</Text>
            <QRCode value={qrData.qr_token} size={200} color="white" backgroundColor="black" />
            <TouchableOpacity
              onPress={handleShareQR}
              className="mt-4 flex-row items-center bg-white rounded-full px-4 py-2"
            >
              <Ionicons name="share-outline" size={18} color="black" />
              <Text className="text-black ml-2">Share QR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rating section */}
        {canRate && (
          <TouchableOpacity
            onPress={() => setRatingModalVisible(true)}
            className="bg-gray-900 rounded-2xl p-4 mb-4 items-center"
          >
            <Ionicons name="star-outline" size={28} color="#fbbf24" />
            <Text className="text-white mt-2">Rate your trip</Text>
          </TouchableOpacity>
        )}

        {existingRating && (
          <View className="bg-gray-900 rounded-2xl p-4 mb-4">
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
          </View>
        )}
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
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
                    className="mx-1"
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
                    className="mx-1"
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