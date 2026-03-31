import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SeatMap = ({ bookedSeats = [], onSeatSelect }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);

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

  const renderSeat = (row, col) => {
    const seatId = `${row}${String.fromCharCode(65 + col)}`;
    const isBooked = bookedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);
    return (
      <TouchableOpacity
        key={seatId}
        style={[
          styles.seat,
          isBooked && styles.booked,
          isSelected && styles.selected,
        ]}
        onPress={() => handleSeatPress(seatId)}
        disabled={isBooked}
      >
        <Text style={styles.seatText}>{seatId}</Text>
      </TouchableOpacity>
    );
  };

  // 10 rows, 4 columns (A, B, C, D)
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
    backgroundColor: '#e0e0e0',
  },
  selectedBox: {
    backgroundColor: '#2c7da0',
  },
  bookedBox: {
    backgroundColor: '#ff6b6b',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
  },
  seat: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  booked: {
    backgroundColor: '#ff6b6b',
  },
  selected: {
    backgroundColor: '#2c7da0',
  },
  seatText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SeatMap;