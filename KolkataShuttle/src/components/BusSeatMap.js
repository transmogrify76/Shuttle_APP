import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BusSeatMap = ({ seatCapacity, occupiedSeats = [], selectedSeat, onSeatSelect }) => {
  const [seatLayout, setSeatLayout] = useState([]);
  const animatedValues = useRef({});

  useEffect(() => {
    // Build seat layout: 4 columns, rows = ceil(seatCapacity / 4)
    const cols = 4;
    const rows = Math.ceil(seatCapacity / cols);
    const layout = [];
    let seatNumber = 1;
    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < cols; col++) {
        if (seatNumber <= seatCapacity) {
          const seatId = seatNumber;
          const isLeftSide = col < 2; // cols 0,1 are left side; cols 2,3 right side
          rowSeats.push({
            seatNumber: seatId,
            isLeftSide,
            isAisle: (col === 2), // after two seats, aisle indicator (not needed but visual)
          });
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
    if (selectedSeat === seatNumber) return 'selected';
    if (occupiedSeats.includes(seatNumber)) return 'occupied';
    return 'available';
  };

  const renderSeat = (seat, rowIdx, colIdx) => {
    if (seat.seatNumber === null) {
      return <View key={`empty-${rowIdx}-${colIdx}`} className="w-14 h-14 mx-1" />;
    }

    const status = getSeatStatus(seat.seatNumber);
    let bgColor = 'bg-gray-700';
    let borderColor = 'border-gray-600';
    let textColor = 'text-gray-400';
    if (status === 'available') {
      bgColor = 'bg-green-800';
      borderColor = 'border-green-600';
      textColor = 'text-white';
    } else if (status === 'selected') {
      bgColor = 'bg-white';
      borderColor = 'border-white';
      textColor = 'text-black';
    } else if (status === 'occupied') {
      bgColor = 'bg-red-800';
      borderColor = 'border-red-700';
      textColor = 'text-red-200';
    }

    return (
      <TouchableOpacity
        key={`seat-${seat.seatNumber}`}
        onPress={() => handlePress(seat.seatNumber)}
        disabled={status === 'occupied'}
        activeOpacity={0.8}
        className={`w-14 h-14 rounded-xl border-2 items-center justify-center mx-1 ${bgColor} ${borderColor}`}
      >
        <Animated.View style={getAnimatedStyle(seat.seatNumber)}>
          <Text className={`text-base font-bold ${textColor}`}>{seat.seatNumber}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="bg-gray-900 rounded-2xl p-4">
      {/* Legend */}
      <View className="flex-row justify-center mb-4">
        <View className="flex-row items-center mx-2">
          <View className="w-4 h-4 rounded-full bg-green-800 mr-1" />
          <Text className="text-gray-300 text-xs">Available</Text>
        </View>
        <View className="flex-row items-center mx-2">
          <View className="w-4 h-4 rounded-full bg-white mr-1" />
          <Text className="text-gray-300 text-xs">Selected</Text>
        </View>
        <View className="flex-row items-center mx-2">
          <View className="w-4 h-4 rounded-full bg-red-800 mr-1" />
          <Text className="text-gray-300 text-xs">Occupied</Text>
        </View>
      </View>

      {/* Driver seat indicator */}
      <View className="flex-row justify-center mb-2">
        <Ionicons name="car-sport-outline" size={20} color="#aaa" />
        <Text className="text-gray-500 text-xs ml-1">Driver seat</Text>
      </View>

      {/* Seat grid */}
      {seatLayout.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} className="flex-row justify-center mb-2">
          {/* Row number on left */}
          <View className="w-8 justify-center items-center">
            <Text className="text-gray-400 text-sm font-bold">{rowIdx + 1}</Text>
          </View>
          {/* Left side seats (cols 0,1) */}
          {row.slice(0, 2).map((seat, colIdx) => renderSeat(seat, rowIdx, colIdx))}
          {/* Aisle spacer */}
          <View className="w-6" />
          {/* Right side seats (cols 2,3) */}
          {row.slice(2, 4).map((seat, colIdx) => renderSeat(seat, rowIdx, colIdx + 2))}
        </View>
      ))}
    </View>
  );
};

export default BusSeatMap;