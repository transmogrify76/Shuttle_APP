import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import Header from '../components/Header';
import BusCard from '../components/BusCard';
import OSMMap from '../components/OSMMap';
import { routes } from '../utils/dummyData';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  const handleSelectBus = (route, busType) => {
    navigation.navigate('SeatSelection', { route, busType });
  };

  return (
    <View style={styles.container}>
      <Header title="Kolkata Shuttle" />

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <OSMMap userLocation={userLocation} />
        <TouchableOpacity style={styles.locationButton} onPress={() => {}}>
          <Ionicons name="locate" size={24} color="#2c7da0" />
        </TouchableOpacity>
      </View>

      {/* Routes List */}
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BusCard route={item} onSelect={handleSelectBus} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          !locationPermission && (
            <Text style={styles.locationWarning}>
              Enable location to see nearby shuttles
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mapContainer: {
    width: width,
    height: height * 0.4,
    position: 'relative',
  },
  locationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  list: {
    paddingVertical: 8,
  },
  locationWarning: {
    textAlign: 'center',
    color: '#ff6b6b',
    padding: 10,
    backgroundColor: '#fff0f0',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
});