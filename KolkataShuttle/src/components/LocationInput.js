import React from 'react';
import { View } from 'react-native';
import { TextInput, IconButton, Text } from 'react-native-paper';

export default function LocationInput() {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <IconButton icon="map-marker" iconColor="#10b981" size={20} />
        <Text variant="bodyMedium">Your current location</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="navigation" iconColor="#10b981" size={20} />
        <TextInput
          mode="flat"
          placeholder="Enter pick-up location"
          placeholderTextColor="#666"
          style={{ flex: 1, backgroundColor: 'transparent' }}
          theme={{ colors: { text: '#fff', placeholder: '#666' } }}
          underlineColor="transparent"
        />
      </View>
    </View>
  );
}