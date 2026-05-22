import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { C } from '../styles/design';

const SeatMap = ({ bookedSeats = [], onSeatSelect }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const animatedValues = useRef({});

  const handleSeatPress = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    let newSelected;
    if (selectedSeats.includes(seatId)) {
      newSelected = selectedSeats.filter((s) => s !== seatId);
    } else {
      newSelected = [...selectedSeats, seatId];
    }
    setSelectedSeats(newSelected);
    if (onSeatSelect) onSeatSelect(newSelected);
  };

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
    }).start();
  };

  const renderSeat = (row, col) => {
    const seatId = `${row}${String.fromCharCode(65 + col)}`;
    const isBooked = bookedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);
    return (
      <TouchableOpacity
        key={seatId}
        onPress={() => handleSeatPress(seatId)}
        onPressIn={() => animateSeat(seatId, 0.9)}
        onPressOut={() => animateSeat(seatId, 1)}
        disabled={isBooked}
      >
        <Animated.View
          style={[
            styles.seat,
            isBooked && styles.booked,
            isSelected && styles.selected,
            getAnimatedStyle(seatId),
          ]}
        >
          <Text style={styles.seatText}>{seatId}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const rows = 10;
  const cols = 4;
  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.availableBox]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.selectedBox]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.bookedBox]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          <Text style={styles.rowLabel}>{rowIndex + 1}</Text>
          {Array.from({ length: cols }).map((_, colIndex) => renderSeat(rowIndex + 1, colIndex))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: C.surface,
    borderRadius: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    marginRight: 6,
  },
  availableBox: {
    backgroundColor: C.green,
  },
  selectedBox: {
    backgroundColor: C.gold,
  },
  bookedBox: {
    backgroundColor: C.red,
  },
  legendText: {
    fontSize: 12,
    color: C.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
    color: C.textMuted,
  },
  seat: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: C.surfaceHigh,
    marginHorizontal: 4,
  },
  booked: {
    backgroundColor: C.redDim,
    borderWidth: 1,
    borderColor: C.red,
  },
  selected: {
    backgroundColor: C.gold,
  },
  seatText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SeatMap;