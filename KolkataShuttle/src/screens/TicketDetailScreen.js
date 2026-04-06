import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getSupportTicket } from '../services/supportApi';

export default function TicketDetailScreen({ route, navigation }) {
  const { ticketId } = route.params;
  const insets = useSafeAreaInsets();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicket();
  }, []);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const data = await getSupportTicket(ticketId);
      setTicket(data);
    } catch (error) {
      Alert.alert('Error', error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'resolved': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Ticket Details" />
      <ScrollView className="flex-1 px-5 pt-5">
        <View className="bg-gray-900 rounded-2xl p-5 mb-4">
          <Text className="text-white text-lg font-bold mb-2">{ticket.subject}</Text>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`font-bold ${getStatusColor(ticket.status)} uppercase`}>
              {ticket.status}
            </Text>
            <Text className="text-gray-400 text-xs">
              {new Date(ticket.created_at).toLocaleString()}
            </Text>
          </View>
          <Text className="text-gray-300 text-base leading-6">{ticket.description}</Text>
          {ticket.attachment_path && (
            <TouchableOpacity className="mt-4 flex-row items-center">
              <Ionicons name="attach-outline" size={20} color="#aaa" />
              <Text className="text-gray-400 ml-2">Attachment available</Text>
            </TouchableOpacity>
          )}
        </View>

        {ticket.resolved_at && (
          <View className="bg-gray-900 rounded-2xl p-4">
            <Text className="text-white text-sm">Resolved on</Text>
            <Text className="text-gray-300 text-sm">
              {new Date(ticket.resolved_at).toLocaleString()}
            </Text>
          </View>
        )}

        {ticket.rejection_reason && (
          <View className="bg-red-900/20 rounded-2xl p-4 mt-4 border border-red-800">
            <Text className="text-red-400 font-bold mb-1">Rejection reason</Text>
            <Text className="text-red-300 text-sm">{ticket.rejection_reason}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}