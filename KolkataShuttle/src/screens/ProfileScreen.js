import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Card, List, Avatar } from 'react-native-paper';
import Header from '../components/Header';

export default function ProfileScreen() {
  const profile = {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98765 43210',
  };

  const menuItems = [
    { icon: 'credit-card', label: 'Payment Methods' },
    { icon: 'help-circle', label: 'Help & Support' },
    { icon: 'cog', label: 'Settings' },
    { icon: 'logout', label: 'Logout', color: '#ef4444' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Header title="Profile" />
      <ScrollView>
        <Card style={{ margin: 16, backgroundColor: '#1a1a1a', alignItems: 'center', paddingVertical: 16 }}>
          <Avatar.Text size={80} label={profile.name.charAt(0)} style={{ backgroundColor: '#10b981' }} />
          <Text variant="titleLarge" style={{ color: '#fff', marginTop: 12 }}>{profile.name}</Text>
          <Text variant="bodyMedium" style={{ color: '#aaa', marginTop: 4 }}>{profile.email}</Text>
          <Text variant="bodyMedium" style={{ color: '#aaa' }}>{profile.phone}</Text>
        </Card>

        {menuItems.map((item, idx) => (
          <List.Item
            key={idx}
            title={item.label}
            titleStyle={{ color: item.color || '#fff' }}
            left={props => <List.Icon {...props} icon={item.icon} color={item.color || '#10b981'} />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#666" />}
            style={{ borderBottomWidth: 1, borderBottomColor: '#2a2a2a', marginHorizontal: 16 }}
          />
        ))}
      </ScrollView>
    </View>
  );
}