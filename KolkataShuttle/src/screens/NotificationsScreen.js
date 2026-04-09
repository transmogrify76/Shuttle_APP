import React, { useEffect, useState } from 'react';
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
import Header from '../components/Header';
import { useNotifications } from '../context/NotificationContext';

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
        className={`p-4 border-b border-gray-800 ${isUnread ? 'bg-gray-900' : 'bg-black'}`}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-3">
            <Text className={`text-base font-bold ${isUnread ? 'text-white' : 'text-gray-400'}`}>
              {item.title}
            </Text>
            <Text className={`text-sm mt-1 ${isUnread ? 'text-gray-300' : 'text-gray-500'}`}>
              {item.message}
            </Text>
            <Text className="text-xs text-gray-600 mt-2">
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
          {isUnread && (
            <View className="w-2 h-2 rounded-full bg-green-500 mt-2" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Notifications" />
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-800">
        <View className="flex-row items-center">
          <Text className="text-gray-400 text-sm mr-2">
            {unreadCount} unread
          </Text>
          {wsConnected ? (
            <Ionicons name="radio" size={12} color="#10b981" />
          ) : (
            <Ionicons name="radio-off" size={12} color="#ef4444" />
          )}
        </View>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text className="text-green-500 text-sm font-semibold">Mark all as read</Text>
        </TouchableOpacity>
      </View>
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="notifications-off-outline" size={60} color="#444" />
          <Text className="text-gray-500 text-base mt-3">No notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        />
      )}
    </View>
  );
}