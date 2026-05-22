import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { C, T } from '../styles/design';

export default function StopDetailsModal({ visible, onClose, stops, routeName }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <LinearGradient
          colors={[C.surfaceUp, C.surface]}
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 20,
            maxHeight: '80%',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: C.borderStrong,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={T.displayMd}>Route Stops: {routeName}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <Ionicons name="close" size={24} color={C.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {stops.map((stop, idx) => (
              <View
                key={stop.stop?.id || idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: 12,
                  borderBottomWidth: idx === stops.length - 1 ? 0 : 1,
                  borderBottomColor: C.border,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: C.goldDim,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.gold }}>{stop.sequence_no}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={T.bodyMd}>{stop.stop?.name || stop.name}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
                    {stop.boarding_allowed && (
                      <View style={{ backgroundColor: C.greenDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.green }}>Pickup allowed</Text>
                      </View>
                    )}
                    {stop.deboarding_allowed && (
                      <View style={{ backgroundColor: C.blueDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.blue }}>Dropoff allowed</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}