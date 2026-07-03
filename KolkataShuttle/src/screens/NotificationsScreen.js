import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useNotifications } from '../context/NotificationContext';
import { C, T } from '../styles/design';

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    loading,
    refreshNotifications,
    markAsRead,
    markAllRead,
    unreadCount,
    wsConnected,
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) {
      Alert.alert('No unread notifications', 'All notifications are already read.');
      return;
    }
    Alert.alert(
      'Mark all as read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => markAllRead() },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isUnread = !item.read_at;
    return (
      <TouchableOpacity
        onPress={() => markAsRead(item.id)}
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          backgroundColor: isUnread ? C.surfaceUp : 'transparent',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[T.bodyMd, { fontWeight: 'bold', color: isUnread ? C.textPrimary : C.textMuted }]}>
              {item.title}
            </Text>
            <Text style={[T.bodySm, { marginTop: 4, color: isUnread ? C.textSecondary : C.textMuted }]}>
              {item.message}
            </Text>
            <Text style={[T.bodySm, { marginTop: 8, color: C.textMuted }]}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
          {isUnread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold, marginTop: 6 }} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="Notifications" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[T.bodySm, { marginRight: 8 }]}>{unreadCount} unread</Text>
          {wsConnected ? (
            <Ionicons name="wifi" size={12} color={C.green} />
          ) : (
            <Ionicons name="wifi-outline" size={12} color={C.red} />
          )}
        </View>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={{ color: C.gold, fontSize: 12, fontWeight: 'bold' }}>Mark all as read</Text>
        </TouchableOpacity>
      </View>
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.gold} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="notifications-off-outline" size={60} color={C.textMuted} />
          <Text style={[T.bodyMd, { marginTop: 12 }]}>No notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
         contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}