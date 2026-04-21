import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getTransactions } from '../services/bookingApi';

const statusOptions = ['all', 'paid', 'failed', 'refunded', 'refund_pending', 'created'];
const monthOptions = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'paid': return 'bg-green-900';
    case 'failed': return 'bg-red-900';
    case 'refunded': return 'bg-blue-900';
    case 'refund_pending': return 'bg-yellow-900';
    case 'created': return 'bg-gray-800';
    default: return 'bg-gray-800';
  }
};

const getStatusTextColor = (status) => {
  switch (status) {
    case 'paid': return 'text-green-400';
    case 'failed': return 'text-red-400';
    case 'refunded': return 'text-blue-400';
    case 'refund_pending': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
};

export default function TransactionsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const filters = {};
      if (selectedStatus !== 'all') filters.status = selectedStatus;
      if (selectedMonth) filters.month = selectedMonth;
      if (selectedYear) filters.year = selectedYear;
      const response = await getTransactions(filters);
      setTransactions(response.items || []);
    } catch (error) {
      Alert.alert('Error', error.message || 'Unable to load transactions');
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const onRefresh = () => loadTransactions(true);

  const applyFilters = () => {
    setFilterModalVisible(false);
    loadTransactions();
  };

  const resetFilters = () => {
    setSelectedStatus('all');
    setSelectedMonth(null);
    setSelectedYear(null);
    setFilterModalVisible(false);
    loadTransactions();
  };

  const renderTransactionItem = ({ item }) => {
    const effectiveStatus = item.effective_status || item.payment_status;
    const routeName = item.route_name || 'Shuttle';
    const pickupName = item.pickup_stop?.name || 'Pickup';
    const dropoffName = item.dropoff_stop?.name || 'Dropoff';
    const amount = parseFloat(item.amount).toFixed(2);
    const date = new Date(item.created_at).toLocaleDateString();
    const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isCancelled = item.booking_status === 'cancelled';
    const isCompleted = item.booking_status === 'completed';

    return (
      <TouchableOpacity
        onPress={() => {
          // Optionally navigate to booking detail
          navigation.navigate('BookingDetail', { bookingId: item.booking_id });
        }}
        className="bg-gray-900 rounded-xl p-4 mb-3 mx-4 border border-gray-800"
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white font-bold text-base flex-1">{routeName}</Text>
          <View className={`px-3 py-1 rounded-full ${getStatusColor(effectiveStatus)}`}>
            <Text className={`text-xs font-bold ${getStatusTextColor(effectiveStatus)} uppercase`}>
              {effectiveStatus?.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <Text className="text-gray-300 text-sm mb-1">
          {pickupName} → {dropoffName}
        </Text>
        <Text className="text-gray-400 text-xs mb-1">
          {date} at {time}
        </Text>
        {isCancelled && item.cancelled_at && (
          <Text className="text-red-400 text-xs mb-1">
            Cancelled: {new Date(item.cancelled_at).toLocaleDateString()}
          </Text>
        )}
        {isCompleted && item.completed_at && (
          <Text className="text-green-400 text-xs mb-1">
            Completed: {new Date(item.completed_at).toLocaleDateString()}
          </Text>
        )}
        <Text className="text-white font-bold text-lg mt-1">₹{amount}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Transactions" />
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-800">
        <Text className="text-gray-400 text-sm">{transactions.length} transactions</Text>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} className="flex-row items-center">
          <Ionicons name="filter-outline" size={20} color="#fff" />
          <Text className="text-white text-sm ml-1">Filter</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : transactions.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="receipt-outline" size={60} color="#444" />
          <Text className="text-gray-500 text-base mt-3">No transactions found</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.payment_id}
          renderItem={renderTransactionItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-end">
          <View className="bg-gray-900 rounded-t-3xl p-5 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-white">Filter Transactions</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-white font-semibold mb-2">Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-full mr-2 ${
                      selectedStatus === status ? 'bg-white' : 'bg-gray-800'
                    }`}
                  >
                    <Text className={selectedStatus === status ? 'text-black' : 'text-white'}>
                      {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text className="text-white font-semibold mb-2">Month (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {monthOptions.map((month) => (
                  <TouchableOpacity
                    key={month.value}
                    onPress={() => setSelectedMonth(selectedMonth === month.value ? null : month.value)}
                    className={`px-4 py-2 rounded-full mr-2 ${
                      selectedMonth === month.value ? 'bg-white' : 'bg-gray-800'
                    }`}
                  >
                    <Text className={selectedMonth === month.value ? 'text-black' : 'text-white'}>
                      {month.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text className="text-white font-semibold mb-2">Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <TouchableOpacity
                    key={year}
                    onPress={() => setSelectedYear(selectedYear === year ? null : year)}
                    className={`px-4 py-2 rounded-full mr-2 ${
                      selectedYear === year ? 'bg-white' : 'bg-gray-800'
                    }`}
                  >
                    <Text className={selectedYear === year ? 'text-black' : 'text-white'}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View className="flex-row justify-between">
                <TouchableOpacity onPress={resetFilters} className="flex-1 mr-2 bg-gray-800 py-3 rounded-full">
                  <Text className="text-white text-center font-medium">Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={applyFilters} className="flex-1 ml-2 bg-white py-3 rounded-full">
                  <Text className="text-black text-center font-medium">Apply</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}