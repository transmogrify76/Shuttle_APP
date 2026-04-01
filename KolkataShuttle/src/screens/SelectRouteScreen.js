import React from 'react';
import { View, FlatList } from 'react-native';
import Header from '../components/Header';
import RouteCard from '../components/RouteCard';
import { routes } from '../utils/dummyData';

export default function SelectRouteScreen({ navigation }) {
  const handleSelect = (route) => {
    navigation.navigate('SeatSelection', { route, busType: route.busType === 'both' ? 'ac' : route.busType });
  };

  return (
    <View className="flex-1 bg-black">
      <Header title="Select Route" />
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RouteCard route={item} onSelect={handleSelect} />}
        contentContainerClassName="py-4"
      />
    </View>
  );
}