import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Header from '../components/Header';
import BusCard from '../components/BusCard';
import { routes } from '../utils/dummyData';

export default function SelectRouteScreen({ navigation }) {
  const handleSelectBus = (route, busType) => {
    navigation.navigate('SeatSelection', { route, busType });
  };

  return (
    <View style={styles.container}>
      <Header title="Select Route" />
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BusCard route={item} onSelect={handleSelectBus} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  list: { paddingVertical: 8 },
});