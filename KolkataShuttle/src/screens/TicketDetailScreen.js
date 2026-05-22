import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { getSupportTicket } from '../services/supportApi';
import { C, T } from '../styles/design';

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
      case 'pending': return C.gold;
      case 'resolved': return C.green;
      case 'rejected': return C.red;
      default: return C.textMuted;
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="Ticket Details" showBack />
      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
          <Text style={[T.displayMd, { marginBottom: 8 }]}>{ticket.subject}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: getStatusColor(ticket.status), fontWeight: 'bold', textTransform: 'uppercase' }}>{ticket.status}</Text>
            <Text style={[T.bodySm, { color: C.textMuted }]}>{new Date(ticket.created_at).toLocaleString()}</Text>
          </View>
          <Text style={[T.bodyMd, { marginBottom: 12 }]}>{ticket.description}</Text>
          {ticket.attachment_path && (
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="attach-outline" size={18} color={C.textSecondary} />
              <Text style={[T.bodySm, { marginLeft: 6, color: C.textSecondary }]}>Attachment available</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {ticket.resolved_at && (
          <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
            <Text style={[T.headingSm, { marginBottom: 4 }]}>Resolved on</Text>
            <Text style={[T.bodyMd]}>{new Date(ticket.resolved_at).toLocaleString()}</Text>
          </LinearGradient>
        )}

        {ticket.rejection_reason && (
          <LinearGradient colors={[C.redDim, C.redDim]} style={{ borderRadius: 24, padding: 20, borderWidth: 1, borderColor: C.red }}>
            <Text style={{ color: C.red, fontWeight: 'bold', marginBottom: 4 }}>Rejection reason</Text>
            <Text style={{ color: C.textSecondary }}>{ticket.rejection_reason}</Text>
          </LinearGradient>
        )}
      </ScrollView>
    </View>
  );
}