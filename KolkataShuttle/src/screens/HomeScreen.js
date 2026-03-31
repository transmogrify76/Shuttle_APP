import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import OSMMap from '../components/OSMMap';
import LocationInput from '../components/LocationInput';
import ServiceCard from '../components/ServiceCard';
import OfferCard from '../components/OfferCard';
import DriverInfo from '../components/DriverInfo';
import { routes } from '../utils/dummyData';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  const handleSelectOffer = (route, busType) => {
    navigation.navigate('SeatSelection', { route, busType });
  };

  // Mock data for services (history)
  const services = [
    { title: 'Shoppine, Baja City Mall', subtitle: 'A. Arredondo Ave., Alamos, Oaxaca road' },
    { title: 'Shoppine, Baja City Mall', subtitle: 'A. Arredondo Ave., Alamos, Oaxaca road' },
  ];

  // Mock offers from routes
  const offers = routes.map(route => ({
    id: route.id,
    vehicle: route.name.split(' → ')[0],
    price: route.fare.ac,
    duration: route.time,
    route: route,
    busType: 'ac',
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <OSMMap userLocation={userLocation} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.greeting}>Hi Josefin</Text>

          <LocationInput />

          <Text style={styles.sectionTitle}>Our Services</Text>
          {services.map((service, idx) => (
            <ServiceCard
              key={idx}
              title={service.title}
              subtitle={service.subtitle}
              onPress={() => console.log('Service pressed')}
            />
          ))}

          <Text style={styles.sectionTitle}>Select an offer:</Text>
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              vehicle={offer.vehicle}
              price={offer.price}
              duration={offer.duration}
              onSelect={() => handleSelectOffer(offer.route, offer.busType)}
            />
          ))}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton}>
              <Text style={styles.resetText}>Reset Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel Trip</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.extraInfo}>₹5 more till arrival</Text>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>VISA®</Text>
            <Text style={styles.paymentAmount}>₹15,000</Text>
          </View>

          <DriverInfo name="Mr. Ramiro Aldabarese" extra="4.9 ★" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  mapContainer: {
    width: '100%',
    height: height * 0.4, // 40% of screen height
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  resetButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 0.48,
    alignItems: 'center',
  },
  resetText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  extraInfo: {
    textAlign: 'center',
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 8,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
});