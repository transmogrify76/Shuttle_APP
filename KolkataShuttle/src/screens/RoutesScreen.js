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
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { listRoutes, getRouteDetails } from '../services/routeApi';
import { eventEmitter } from '../utils/eventEmitter';
import { C, T } from '../styles/design';

const RELEVANT_RESOURCES = new Set(['routes', 'stops']);

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

    const handleRefresh = (payload) => {
      const resources = payload?.resources || payload?.keys || [];
      if (!resources.some((r) => RELEVANT_RESOURCES.has(r))) return;
      fetchRoutes();
      // Keep an open route-detail modal in sync too (e.g. stops_bulk_uploaded,
      // route_fares_changed while the user is looking at that route).
      if (modalVisible && selectedRoute) {
        getRouteDetails(selectedRoute.id).then(setRouteDetail).catch(() => {});
      }
    };
    eventEmitter.on('refreshData', handleRefresh);
    return () => eventEmitter.off('refreshData', handleRefresh);
  }, [modalVisible, selectedRoute]);

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
    <TouchableOpacity onPress={() => handleRoutePress(item)} style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[T.bodyLg, { flex: 1 }]}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.is_active ? (
              <View style={{ backgroundColor: C.greenDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: C.green, fontSize: 10, fontWeight: 'bold' }}>Active</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: C.redDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: C.red, fontSize: 10, fontWeight: 'bold' }}>Inactive</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={C.textMuted} style={{ marginLeft: 8 }} />
          </View>
        </View>
        <Text style={[T.bodySm, { color: C.textMuted }]}>Code: {item.code || 'N/A'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="All Routes" />
      {routes.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="map-outline" size={60} color={C.textMuted} />
          <Text style={[T.bodyMd, { marginTop: 12 }]}>No routes available</Text>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <View style={{ flex: 1, marginTop: 40, backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={T.displayMd}>Route Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>
            {detailLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={C.gold} />
              </View>
            ) : (
              <ScrollView style={{ flex: 1, padding: 20 }}>
                <Text style={[T.bodyLg, { marginBottom: 4 }]}>{routeDetail?.name}</Text>
                <Text style={[T.bodySm, { color: C.textMuted, marginBottom: 16 }]}>Code: {routeDetail?.code}</Text>
                <Text style={[T.headingSm, { marginBottom: 12 }]}>Stops</Text>
                {routeDetail?.stops?.map((stop, idx) => (
                  <View key={stop.route_stop_id} style={{ flexDirection: 'row', marginBottom: 16 }}>
                    <View style={{ width: 32, alignItems: 'center' }}>
                      <LinearGradient colors={[C.goldDim, 'rgba(201,168,76,0.05)']} style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.gold }}>{stop.sequence_no}</Text>
                      </LinearGradient>
                      {idx < routeDetail.stops.length - 1 && <View style={{ flex: 1, width: 2, backgroundColor: C.border, marginVertical: 4 }} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={T.bodyMd}>{stop.stop.name}</Text>
                      <Text style={[T.bodySm, { color: C.textMuted, marginBottom: 6 }]}>
                        Lat: {stop.stop.lat}, Lng: {stop.stop.lng}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {stop.boarding_allowed && (
                          <View style={{ backgroundColor: C.greenDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ color: C.green, fontSize: 10, fontWeight: 'bold' }}>Pickup</Text>
                          </View>
                        )}
                        {stop.deboarding_allowed && (
                          <View style={{ backgroundColor: C.blueDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ color: C.blue, fontSize: 10, fontWeight: 'bold' }}>Dropoff</Text>
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