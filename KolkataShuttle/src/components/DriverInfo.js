import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DriverInfo({ name, extra }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.extra}>{extra}</Text>
        </View>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#10b981" />
          <Text style={styles.messageText}>Message</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.routeContainer}>
        <Ionicons name="location" size={16} color="#10b981" />
        <Text style={styles.routeText}>Shoppine, Baja City Mall – A. Arredondo Ave., Alamos, Oaxaca road</Text>
      </View>
      <View style={styles.routeContainer}>
        <Ionicons name="navigate" size={16} color="#10b981" />
        <Text style={styles.routeText}>Muralto Muhammad Airport – A. Arredondo Ave., Alamos, Oaxaca road</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  extra: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  messageText: {
    color: '#10b981',
    fontSize: 14,
    marginLeft: 4,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  routeText: {
    flex: 1,
    fontSize: 12,
    color: '#4b5563',
    marginLeft: 8,
  },
});