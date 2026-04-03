import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Header from '../components/Header';
import AnimatedButton from '../components/AnimatedButton';
import {
  getBookingCurrentStatus,
  getBookingDetail,
  cancelBooking,
  getBookingQR,
  createRating,
  getBookingRating,
  getDriverVehicleInfo,
} from '../services/bookingApi';

export default function BookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState(null);
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
  const [driverVehicleInfo, setDriverVehicleInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Try live status first
      try {
        const liveStatus = await getBookingCurrentStatus(bookingId);
        setStatus(liveStatus);
        // Also fetch driver info from the trip
        if (liveStatus.scheduled_trip_id) {
          const info = await getDriverVehicleInfo(liveStatus.scheduled_trip_id);
          setDriverVehicleInfo(info);
        }
      } catch (e) {
        // Fallback to booking detail
        const bookingData = await getBookingDetail(bookingId);
        setBooking(bookingData);
        if (bookingData.scheduled_trip_id) {
          const info = await getDriverVehicleInfo(bookingData.scheduled_trip_id);
          setDriverVehicleInfo(info);
        }
      }

      // Fetch QR
      try {
        const qr = await getBookingQR(bookingId);
        setQrData(qr);
      } catch (e) {}

      // Fetch rating
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
      'Are you sure?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelBooking(bookingId);
              Alert.alert('Cancelled', 'Booking cancelled.');
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
      } catch (e) {}
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
      Alert.alert('Thank you!', 'Rating submitted.');
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

  const displayData = status || booking;
  const trip = displayData?.scheduled_trip || displayData;
  const canCancel = displayData?.booking_status === 'booked' || displayData?.booking_status === 'pending_payment';
  const canRate = displayData?.booking_status === 'completed' && !existingRating;
  const liveProgress = status;

  const pickupStopName = displayData?.pickup_stop?.stop?.name || 'Pickup location';
  const dropoffStopName = displayData?.dropoff_stop?.stop?.name || 'Dropoff location';
  const tripStartTime = trip?.planned_start_at ? new Date(trip.planned_start_at).toLocaleString() : 'Not scheduled';

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Booking Details" />
      <ScrollView className="flex-1 px-5 pt-5">
        {/* Status Card */}
        <View className="bg-gray-900 rounded-2xl p-4 mb-4">
          <Text className="text-white text-sm">Status</Text>
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-white text-2xl font-bold capitalize">
              {displayData?.booking_status?.replace('_', ' ')}
            </Text>
            {canCancel && !cancelling && (
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close-circle-outline" size={28} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
          {displayData?.payment_hold_expires_at && (
            <Text className="text-yellow-400 text-xs mt-1">
              Payment hold expires: {new Date(displayData.payment_hold_expires_at).toLocaleString()}
            </Text>
          )}
          {cancelling && <ActivityIndicator size="small" color="#ef4444" className="mt-2" />}
        </View>

        {/* Driver & Vehicle Info */}
        {driverVehicleInfo && (
          <View className="bg-gray-900 rounded-2xl p-4 mb-4">
            <Text className="text-white text-lg font-bold mb-2">Driver & Vehicle</Text>
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-circle-outline" size={20} color="#aaa" />
              <Text className="text-gray-300 ml-2">Driver: {driverVehicleInfo.driver_name || 'N/A'}</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text className="text-gray-300 ml-1">
                {driverVehicleInfo.driver_average_rating?.toFixed(1)} ({driverVehicleInfo.driver_rating_count} ratings)
              </Text>
            </View>
            <View className="flex-row items-center mb-1">
              <Ionicons name="car-outline" size={20} color="#aaa" />
              <Text className="text-gray-300 ml-2">
                {driverVehicleInfo.vehicle_name || 'Bus'} • {driverVehicleInfo.vehicle_registration_number || ''}
              </Text>
            </View>
            {driverVehicleInfo.vehicle_model && (
              <Text className="text-gray-400 text-xs ml-7">
                {driverVehicleInfo.vehicle_model} ({driverVehicleInfo.vehicle_color})
              </Text>
            )}
          </View>
        )}

        {/* Trip Info */}
        <View className="bg-gray-900 rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-bold mb-2">Trip Details</Text>
          <View className="flex-row items-center mb-2">
            <Ionicons name="time" size={20} color="#aaa" />
            <Text className="text-gray-300 ml-2">Trip starts: {tripStartTime}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="navigate" size={20} color="#aaa" />
            <Text className="text-gray-300 ml-2">
              {trip?.trip_from_stop?.name || 'Start'} → {trip?.trip_to_stop?.name || 'End'}
            </Text>
          </View>
        </View>

        {/* Your Journey */}
        <View className="bg-gray-900 rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-bold mb-2">Your Journey</Text>
          <View className="flex-row items-center mb-3">
            <View className="w-6 h-6 rounded-full bg-green-700 items-center justify-center mr-3">
              <Ionicons name="log-in-outline" size={14} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium">Pickup: {pickupStopName}</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="w-6 h-6 rounded-full bg-red-700 items-center justify-center mr-3">
              <Ionicons name="log-out-outline" size={14} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium">Dropoff: {dropoffStopName}</Text>
            </View>
          </View>
        </View>

        {/* Live Progress */}
        {liveProgress && (
          <View className="bg-gray-900 rounded-2xl p-4 mb-4">
            <Text className="text-white text-lg font-bold mb-2">Live Progress</Text>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-400">
                Boarding: {liveProgress.boarding_scan_completed ? '✅ Completed' : '⏳ Not yet'}
              </Text>
              <Text className="text-gray-400">
                Drop: {liveProgress.drop_scan_completed ? '✅ Completed' : '⏳ Not yet'}
              </Text>
            </View>
            {liveProgress.current_progress_stop && (
              <View className="bg-gray-800 rounded-xl p-3 mb-3">
                <Text className="text-white text-sm">Current stop:</Text>
                <Text className="text-white font-bold">{liveProgress.current_progress_stop.stop?.name}</Text>
                <Text className="text-yellow-400 text-xs">Status: {liveProgress.current_progress_stop.event_status}</Text>
              </View>
            )}
            <Text className="text-white text-sm font-semibold mb-2">Upcoming stops:</Text>
            {liveProgress.segment_stops?.filter(s => s.stop_status === 'upcoming').slice(0, 3).map((stop, idx) => (
              <View key={idx} className="flex-row items-center mb-2">
                <Ionicons name="radio-button-off" size={14} color="#aaa" />
                <Text className="text-gray-400 text-xs ml-2">
                  {stop.stop?.name} – in ~{stop.assume_time_diff_minutes} min
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* QR Code */}
        {qrData && (
          <View className="bg-gray-900 rounded-2xl p-4 mb-4 items-center">
            <Text className="text-white text-lg font-bold mb-3">Boarding Pass</Text>
            <QRCode value={qrData.qr_token} size={200} color="white" backgroundColor="black" />
            <TouchableOpacity onPress={handleShareQR} className="mt-4 flex-row items-center bg-white rounded-full px-4 py-2">
              <Ionicons name="share-outline" size={18} color="black" />
              <Text className="text-black ml-2">Share QR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rating */}
        {canRate && (
          <TouchableOpacity onPress={() => setRatingModalVisible(true)} className="bg-gray-900 rounded-2xl p-4 mb-4 items-center">
            <Ionicons name="star-outline" size={28} color="#fbbf24" />
            <Text className="text-white mt-2">Rate your trip</Text>
          </TouchableOpacity>
        )}
        {existingRating && (
          <View className="bg-gray-900 rounded-2xl p-4 mb-4">
            <Text className="text-white text-lg font-bold mb-2">Your Rating</Text>
            <View className="flex-row items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Ionicons key={i} name={i < existingRating.trip_rating ? 'star' : 'star-outline'} size={20} color="#fbbf24" />
              ))}
              <Text className="text-white ml-2">Trip</Text>
            </View>
            <View className="flex-row items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Ionicons key={i} name={i < existingRating.driver_rating ? 'star' : 'star-outline'} size={20} color="#fbbf24" />
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
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setTripRating(star)}>
                  <Ionicons name={star <= tripRating ? 'star' : 'star-outline'} size={32} color="#fbbf24" className="mx-1" />
                </TouchableOpacity>
              ))}
            </View>
            <Text className="font-medium mb-1">Driver rating</Text>
            <View className="flex-row justify-center mb-4">
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setDriverRating(star)}>
                  <Ionicons name={star <= driverRating ? 'star' : 'star-outline'} size={32} color="#fbbf24" className="mx-1" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput className="border border-gray-300 rounded-xl p-3 mb-4" placeholder="Write a review (optional)" value={reviewText} onChangeText={setReviewText} multiline numberOfLines={3} />
            <View className="flex-row justify-between">
              <TouchableOpacity onPress={() => setRatingModalVisible(false)} className="px-6 py-2 rounded-full bg-gray-200">
                <Text className="text-black">Cancel</Text>
              </TouchableOpacity>
              <AnimatedButton title={submittingRating ? 'Submitting...' : 'Submit'} onPress={handleSubmitRating} disabled={submittingRating} style={{ width: 100 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}