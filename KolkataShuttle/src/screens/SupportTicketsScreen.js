import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { listSupportTickets } from '../services/supportApi';
import { C, T } from '../styles/design';

export default function SupportTicketsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await listSupportTickets();
      setTickets(data.items || []);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return C.goldDim;
      case 'resolved': return C.greenDim;
      case 'rejected': return C.redDim;
      default: return C.surfaceHigh;
    }
  };
  const getStatusTextColor = (status) => {
    switch (status) {
      case 'pending': return C.gold;
      case 'resolved': return C.green;
      case 'rejected': return C.red;
      default: return C.textMuted;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })} activeOpacity={0.8}>
      <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 20, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[T.bodyMd, { flex: 1 }]}>{item.subject}</Text>
          <View style={{ backgroundColor: getStatusColor(item.status), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 }}>
            <Text style={{ color: getStatusTextColor(item.status), fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{item.status}</Text>
          </View>
        </View>
        <Text style={[T.bodySm, { marginBottom: 6 }]} numberOfLines={2}>{item.description}</Text>
        <Text style={[T.bodySm, { color: C.textMuted }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
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
      <Header title="Support Tickets" />
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateTicket')}
        style={{
          position: 'absolute', bottom: insets.bottom + 20, right: 20,
          backgroundColor: C.gold, borderRadius: 30, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
          zIndex: 10,
        }}
      >
        <Ionicons name="add" size={24} color="#000" />
      </TouchableOpacity>
      {tickets.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="chatbubble-outline" size={60} color={C.textMuted} />
          <Text style={[T.bodyMd, { marginTop: 12 }]}>No support tickets yet</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateTicket')} style={{ marginTop: 20, backgroundColor: C.gold, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 30 }}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Create New Ticket</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}
    </View>
  );
}