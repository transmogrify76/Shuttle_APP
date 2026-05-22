import React, { useState, useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import RouteCard from '../components/RouteCard';
import { listRoutes } from '../services/routeApi';
import { C } from '../styles/design';

export default function SelectRouteScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    listRoutes(true).then(({ items }) => setRoutes(items)).catch(console.error);
  }, []);

  const handleSelect = (route) => {
    navigation.navigate('SeatSelection', { route, busType: route.has_ac ? 'ac' : 'nonAc' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="Select Route" showBack />
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RouteCard route={item} onSelect={handleSelect} />}
        contentContainerStyle={{ paddingVertical: 16 }}
      />
    </View>
  );
}