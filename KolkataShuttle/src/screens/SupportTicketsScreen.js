import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { listSupportTickets } from '../services/supportApi';

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
      case 'pending': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
      className="bg-gray-900 rounded-xl p-4 mb-3 mx-4 border border-gray-800"
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold text-base flex-1">{item.subject}</Text>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
          <Text className="text-white text-xs font-bold uppercase">{item.status}</Text>
        </View>
      </View>
      <Text className="text-gray-400 text-sm" numberOfLines={2}>{item.description}</Text>
      <Text className="text-gray-500 text-xs mt-2">
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
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
      <Header title="Support Tickets" />
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateTicket')}
        className="absolute bottom-6 right-6 bg-white rounded-full p-3 shadow-lg z-10"
      >
        <Ionicons name="add" size={24} color="#000" />
      </TouchableOpacity>
      {tickets.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="chatbubble-outline" size={60} color="#444" />
          <Text className="text-gray-500 text-base mt-3">No support tickets yet</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateTicket')}
            className="mt-4 bg-white px-6 py-2 rounded-full"
          >
            <Text className="text-black font-bold">Create New Ticket</Text>
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