import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Text, Card, Button, IconButton, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OSMMap from '../components/OSMMap';
import RideOptionCard from '../components/RideOptionCard';
import { routes } from '../utils/dummyData';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0] || 'User';

  const [userLocation, setUserLocation] = useState(null);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setPickup('Your current location');
      }
    })();
  }, []);

  useEffect(() => {
    if (routes.length) {
      const rideOptions = routes.map(route => ({
        id: route.id,
        icon: 'bus-outline',
        name: route.name.split(' → ')[0],
        price: route.fare.ac,
        duration: route.time,
        route,
        busType: 'ac',
      }));
      setRides(rideOptions);
      setSelectedRide(rideOptions[0]);
    }
  }, [routes]);

  const handleConfirm = () => {
    if (selectedRide) {
      navigation.navigate('SeatSelection', {
        route: selectedRide.route,
        busType: selectedRide.busType,
      });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        {/* Map with top safe area */}
        <View style={[styles.mapContainer, { paddingTop: insets.top }]}>
          <OSMMap userLocation={userLocation} />
        </View>

        {/* Bottom sheet */}
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom }]}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header with user greeting */}
            <View style={styles.header}>
              <Text style={styles.greeting}>Where to, {firstName}?</Text>
            </View>

            {/* Location inputs (uber style) */}
            <View style={styles.locationContainer}>
              <View style={styles.locationRow}>
                <View style={styles.dot} />
                <TextInput
                  style={styles.input}
                  placeholder="Pickup location"
                  value={pickup}
                  onChangeText={setPickup}
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.locationRow}>
                <View style={styles.square} />
                <TextInput
                  style={styles.input}
                  placeholder="Destination"
                  value={destination}
                  onChangeText={setDestination}
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>

            {/* Ride options */}
            <Text style={styles.sectionTitle}>Choose a ride</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#000" style={{ marginVertical: 20 }} />
            ) : (
              rides.map(ride => (
                <RideOptionCard
                  key={ride.id}
                  icon={ride.icon}
                  name={ride.name}
                  price={ride.price}
                  duration={ride.duration}
                  selected={selectedRide?.id === ride.id}
                  onSelect={() => setSelectedRide(ride)}
                />
              ))
            )}

            {/* Confirm button */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleConfirm}
                disabled={!selectedRide || !destination}
                style={styles.confirmButton}
                labelStyle={styles.confirmLabel}
                buttonColor="#000"
              >
                Confirm ₹{selectedRide ? selectedRide.price : ''}
              </Button>
            </View>

            <Text style={styles.footerNote}>Scheduled rides available</Text>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    height: height * 0.5,
    width,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  locationContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    marginBottom: 24,
    paddingVertical: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
    marginRight: 12,
  },
  square: {
    width: 12,
    height: 12,
    backgroundColor: '#000',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  confirmButton: {
    borderRadius: 30,
    paddingVertical: 4,
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
});