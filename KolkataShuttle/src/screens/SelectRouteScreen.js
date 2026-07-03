import React, { useState, useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import RouteCard from '../components/RouteCard';
import { listRoutes } from '../services/routeApi';
import { eventEmitter } from '../utils/eventEmitter';
import { C } from '../styles/design';

const RELEVANT_RESOURCES = new Set(['routes', 'stops']);

export default function SelectRouteScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [routes, setRoutes] = useState([]);

  const loadRoutes = () => {
    listRoutes(true).then(({ items }) => setRoutes(items)).catch(console.error);
  };

  useEffect(() => {
    loadRoutes();

    const handleRefresh = (payload) => {
      const resources = payload?.resources || payload?.keys || [];
      if (resources.some((r) => RELEVANT_RESOURCES.has(r))) {
        loadRoutes();
      }
    };
    eventEmitter.on('refreshData', handleRefresh);
    return () => eventEmitter.off('refreshData', handleRefresh);
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