import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

export default function ProfileScreen() {
  const profile = {
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@example.com',
    phone: '+91 98765 43210',
  };

  const menuItems = [
    { icon: 'card-outline', label: 'Payment Methods' },
    { icon: 'help-circle-outline', label: 'Help & Support' },
    { icon: 'settings-outline', label: 'Settings' },
    { icon: 'log-out-outline', label: 'Logout', color: '#ef4444' },
  ];

  return (
    <View style={styles.container}>
      <Header title="Profile" />
      <ScrollView>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.phone}>{profile.phone}</Text>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.menuItem}>
              <Ionicons name={item.icon} size={24} color={item.color || '#10b981'} />
              <Text style={[styles.menuLabel, item.color && { color: item.color }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  menu: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginBottom: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#1f2937',
  },
});