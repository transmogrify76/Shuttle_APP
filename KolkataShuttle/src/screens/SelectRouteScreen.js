import React from 'react';
import { View, FlatList } from 'react-native';
import Header from '../components/Header';
import RouteCard from '../components/RouteCard';
import { listRoutes } from '../services/routeApi'; // use real API

export default function SelectRouteScreen({ navigation }) {
  const [routes, setRoutes] = useState([]);
  useEffect(() => {
    // Fetch routes from API instead of dummy data
    listRoutes(true).then(({ items }) => setRoutes(items)).catch(console.error);
  }, []);

  const handleSelect = (route) => {
    navigation.navigate('SeatSelection', { route, busType: route.has_ac ? 'ac' : 'nonAc' });
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