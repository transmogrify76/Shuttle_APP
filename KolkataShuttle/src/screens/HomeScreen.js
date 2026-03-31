import React, { useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { Text, Card, Button, IconButton, TextInput, Divider, Chip } from 'react-native-paper';
import OSMMap from '../components/OSMMap';
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

  // Indian-themed services (you can replace with real data later)
  const services = [
    { title: 'Shoppine, Baja City Mall', subtitle: 'A. Arredondo Ave., Alamos, Oaxaca road' },
    { title: 'Shoppine, Baja City Mall', subtitle: 'A. Arredondo Ave., Alamos, Oaxaca road' },
  ];

  // Map routes to offers (using Indian vehicle names)
  const offers = routes.map(route => ({
    id: route.id,
    vehicle: route.name.split(' → ')[0], // e.g., "Salt Lake Sector V"
    price: route.fare.ac,
    duration: route.time,
    route: route,
    busType: 'ac',
  }));

  const handleSelectOffer = (route, busType) => {
    navigation.navigate('SeatSelection', { route, busType });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Map container */}
      <View style={{ height: height * 0.5, width }}>
        <OSMMap userLocation={userLocation} />
      </View>

      {/* Scrollable bottom sheet */}
      <ScrollView
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: height * 0.65,
          backgroundColor: '#000',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Greeting */}
        <Text variant="headlineLarge" style={{ marginHorizontal: 16, marginBottom: 8, color: '#fff', fontWeight: 'bold' }}>
          Hello, Rajesh
        </Text>

        {/* Location card */}
        <Card style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1a1a', borderRadius: 16 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <IconButton icon="map-marker" iconColor="#fff" size={20} />
              <Text variant="bodyMedium" style={{ color: '#fff', marginLeft: 4 }}>Your current location</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton icon="navigation" iconColor="#fff" size={20} />
              <TextInput
                mode="flat"
                placeholder="Enter pick-up location"
                placeholderTextColor="#666"
                style={{ flex: 1, backgroundColor: 'transparent' }}
                theme={{ colors: { text: '#fff', placeholder: '#666', primary: '#fff' } }}
                underlineColor="transparent"
                activeUnderlineColor="#fff"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Services section */}
        <Text variant="titleLarge" style={{ marginHorizontal: 16, marginVertical: 8, color: '#fff', fontWeight: '600' }}>
          Our Services
        </Text>
        {services.map((service, idx) => (
          <Card key={idx} style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1a1a1a', borderRadius: 12 }}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton icon="clock-outline" iconColor="#fff" size={24} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text variant="titleMedium" style={{ color: '#fff' }}>{service.title}</Text>
                <Text variant="bodySmall" style={{ color: '#aaa' }}>{service.subtitle}</Text>
              </View>
              <IconButton icon="chevron-right" iconColor="#fff" size={20} />
            </Card.Content>
          </Card>
        ))}

        {/* Offers section */}
        <Text variant="titleLarge" style={{ marginHorizontal: 16, marginVertical: 8, color: '#fff', fontWeight: '600' }}>
          Select an offer:
        </Text>
        {offers.map((offer) => (
          <Card key={offer.id} style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1a1a1a', borderRadius: 12 }}>
            <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconButton icon="bus" iconColor="#fff" size={24} />
                <Text variant="titleMedium" style={{ color: '#fff', marginLeft: 8 }}>{offer.vehicle}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="titleMedium" style={{ color: '#fff' }}>₹{offer.price}</Text>
                <Text variant="bodySmall" style={{ color: '#aaa' }}>{offer.duration}</Text>
              </View>
            </Card.Content>
            <Card.Actions style={{ justifyContent: 'flex-end', paddingTop: 0 }}>
              <Button mode="text" onPress={() => handleSelectOffer(offer.route, offer.busType)} textColor="#fff">
                Book
              </Button>
            </Card.Actions>
          </Card>
        ))}

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginVertical: 12 }}>
          <Button mode="outlined" onPress={() => {}} style={{ flex: 1, marginRight: 8 }} textColor="#fff" buttonColor="transparent">
            Reset Offer
          </Button>
          <Button mode="outlined" onPress={() => {}} style={{ flex: 1, marginLeft: 8 }} textColor="#ef4444" buttonColor="transparent">
            Cancel Trip
          </Button>
        </View>

        {/* Fare info */}
        <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#fff', marginVertical: 8 }}>
          ₹5 more till arrival
        </Text>

        {/* Payment row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2a2a2a' }}>
          <Text variant="titleMedium" style={{ color: '#fff' }}>VISA®</Text>
          <Text variant="titleLarge" style={{ color: '#fff' }}>₹15,000</Text>
        </View>

        {/* Driver info (Indian name) */}
        <Card style={{ marginHorizontal: 16, marginVertical: 12, backgroundColor: '#1a1a1a', borderRadius: 16 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                <Text variant="titleLarge" style={{ color: '#000' }}>R</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="titleMedium" style={{ color: '#fff' }}>Ramesh Kumar</Text>
                <Text variant="bodySmall" style={{ color: '#aaa' }}>4.8 ★</Text>
              </View>
              <Button mode="text" icon="chat" onPress={() => {}} textColor="#fff">Message</Button>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <IconButton icon="map-marker" iconColor="#fff" size={16} style={{ margin: 0 }} />
              <Text variant="bodySmall" style={{ color: '#ddd', flex: 1, marginLeft: 4 }}>Shoppine, Baja City Mall – A. Arredondo Ave., Alamos, Oaxaca road</Text>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <IconButton icon="navigation" iconColor="#fff" size={16} style={{ margin: 0 }} />
              <Text variant="bodySmall" style={{ color: '#ddd', flex: 1, marginLeft: 4 }}>Muralto Muhammad Airport – A. Arredondo Ave., Alamos, Oaxaca road</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}