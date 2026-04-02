import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { listRoutes, getRouteDetails } from '../services/routeApi';

export default function RoutesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [routeDetail, setRouteDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const { items } = await listRoutes(true);
      setRoutes(items);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoutePress = async (route) => {
    setSelectedRoute(route);
    setModalVisible(true);
    setDetailLoading(true);
    try {
      const detail = await getRouteDetails(route.id);
      setRouteDetail(detail);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const renderRouteItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleRoutePress(item)}
      className="bg-gray-900 rounded-2xl p-4 mb-3 mx-4 border border-gray-800"
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold text-lg flex-1">{item.name}</Text>
        <View className="flex-row items-center">
          {item.is_active ? (
            <View className="bg-green-500/20 px-2 py-1 rounded-full">
              <Text className="text-green-400 text-xs">Active</Text>
            </View>
          ) : (
            <View className="bg-red-500/20 px-2 py-1 rounded-full">
              <Text className="text-red-400 text-xs">Inactive</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#666" className="ml-2" />
        </View>
      </View>
      <Text className="text-gray-400 text-sm">Code: {item.code || 'N/A'}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="All Routes" />
      {routes.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="map-outline" size={60} color="#444" />
          <Text className="text-gray-500 text-base mt-3">No routes available</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={renderRouteItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}

      {/* Route Detail Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/90">
          <View className="flex-1 mt-20 bg-black rounded-t-3xl">
            <View className="flex-row justify-between items-center p-5 border-b border-gray-800">
              <Text className="text-white text-2xl font-bold">Route Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            {detailLoading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : (
              <ScrollView className="flex-1 p-5">
                <Text className="text-white text-xl font-bold mb-2">{routeDetail?.name}</Text>
                <Text className="text-gray-400 mb-4">Code: {routeDetail?.code}</Text>

                <Text className="text-white text-lg font-semibold mb-3">Stops</Text>
                {routeDetail?.stops?.map((stop, idx) => (
                  <View key={stop.route_stop_id} className="flex-row items-start mb-3">
                    <View className="w-6 h-6 rounded-full bg-gray-800 items-center justify-center mr-3">
                      <Text className="text-white text-xs font-bold">{stop.sequence_no}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">{stop.stop.name}</Text>
                      <Text className="text-gray-400 text-xs">
                        Lat: {stop.stop.lat}, Lng: {stop.stop.lng}
                      </Text>
                      <View className="flex-row mt-1">
                        {stop.boarding_allowed && (
                          <View className="bg-green-500/20 px-2 py-0.5 rounded-full mr-2">
                            <Text className="text-green-400 text-xs">Pickup</Text>
                          </View>
                        )}
                        {stop.deboarding_allowed && (
                          <View className="bg-blue-500/20 px-2 py-0.5 rounded-full">
                            <Text className="text-blue-400 text-xs">Dropoff</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}