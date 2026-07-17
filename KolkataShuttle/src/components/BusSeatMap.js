import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T } from '../styles/design';

const BusSeatMap = ({ seatCapacity, occupiedSeats = [], selectedSeats = [], pendingSeat = null, onSeatSelect }) => {
  const [seatLayout, setSeatLayout] = useState([]);
  const animatedValues = useRef({});

  useEffect(() => {
    const cols = 4;
    const rows = Math.ceil(seatCapacity / cols);
    const layout = [];
    let seatNumber = 1;
    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < cols; col++) {
        if (seatNumber <= seatCapacity) {
          rowSeats.push({ seatNumber, isLeftSide: col < 2 });
          seatNumber++;
        } else {
          rowSeats.push({ seatNumber: null });
        }
      }
      layout.push(rowSeats);
    }
    setSeatLayout(layout);
  }, [seatCapacity]);

  const getAnimatedStyle = (seatId) => {
    if (!animatedValues.current[seatId]) {
      animatedValues.current[seatId] = new Animated.Value(1);
    }
    return { transform: [{ scale: animatedValues.current[seatId] }] };
  };

  const animateSeat = (seatId, toValue) => {
    Animated.spring(animatedValues.current[seatId], {
      toValue,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  const handlePress = (seatNumber) => {
    if (occupiedSeats.includes(seatNumber)) return;
    animateSeat(seatNumber, 0.9);
    setTimeout(() => animateSeat(seatNumber, 1), 100);
    onSeatSelect(seatNumber);
  };

  const getSeatStatus = (seatNumber) => {
    if (!seatNumber) return 'empty';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    if (pendingSeat === seatNumber) return 'pending';
    if (occupiedSeats.includes(seatNumber)) return 'occupied';
    return 'available';
  };

  const renderSeat = (seat, rowIdx, colIdx) => {
    if (seat.seatNumber === null) {
      return <View key={`empty-${rowIdx}-${colIdx}`} style={{ width: 52, height: 52, marginHorizontal: 4 }} />;
    }

    const status = getSeatStatus(seat.seatNumber);
    let bgColor, borderColor, textColor;
    if (status === 'available') {
      bgColor = C.greenDim;
      borderColor = C.green;
      textColor = C.green;
    } else if (status === 'selected') {
      bgColor = C.gold;
      borderColor = C.gold;
      textColor = '#000';
    } else if (status === 'pending') {
      // Tapped, waiting for the traveller-assignment modal to be completed —
      // visually distinct from a fully-assigned seat so the user can see
      // exactly which seat they're currently choosing.
      bgColor = 'rgba(201,168,76,0.25)';
      borderColor = C.gold;
      textColor = C.gold;
    } else if (status === 'occupied') {
      bgColor = C.redDim;
      borderColor = C.red;
      textColor = C.red;
    } else {
      bgColor = C.surfaceHigh;
      borderColor = C.border;
      textColor = C.textMuted;
    }

    return (
      <TouchableOpacity
        key={`seat-${seat.seatNumber}`}
        onPress={() => handlePress(seat.seatNumber)}
        disabled={status === 'occupied'}
        activeOpacity={0.8}
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 4,
        }}
      >
        <Animated.View style={getAnimatedStyle(seat.seatNumber)}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: textColor }}>{seat.seatNumber}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ backgroundColor: C.surfaceUp, borderRadius: 24, padding: 16 }}>
      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.green, marginRight: 6 }} />
          <Text style={T.bodySm}>Available</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.gold, marginRight: 6 }} />
          <Text style={T.bodySm}>Selected</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.red, marginRight: 6 }} />
          <Text style={T.bodySm}>Occupied</Text>
        </View>
      </View>

      {/* Driver indicator */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12, gap: 6 }}>
        <Ionicons name="car-sport-outline" size={16} color={C.textMuted} />
        <Text style={[T.bodySm, { color: C.textMuted }]}>Driver seat</Text>
      </View>

      {/* Seat grid */}
      {seatLayout.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
          <View style={{ width: 30, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[T.bodySm, { fontWeight: 'bold', color: C.textMuted }]}>{rowIdx + 1}</Text>
          </View>
          {row.slice(0, 2).map((seat, colIdx) => renderSeat(seat, rowIdx, colIdx))}
          <View style={{ width: 16 }} /> {/* aisle */}
          {row.slice(2, 4).map((seat, colIdx) => renderSeat(seat, rowIdx, colIdx + 2))}
        </View>
      ))}
    </View>
  );
};

export default BusSeatMap;