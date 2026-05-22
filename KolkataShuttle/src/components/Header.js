import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationContext';
import { C, T } from '../styles/design';

export default function Header({ title, showBack = false }) {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

  return (
    <SafeAreaView style={{ backgroundColor: C.bg }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={T.displayMd}>{title}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ position: 'relative' }}>
          <Ionicons name="notifications-outline" size={24} color={C.gold} />
          {unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -6,
                backgroundColor: C.gold,
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                paddingHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}