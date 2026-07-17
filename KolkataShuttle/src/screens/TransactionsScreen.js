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
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { getTransactions, getInvoice } from '../services/bookingApi';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { eventEmitter } from '../utils/eventEmitter';
import { C, T } from '../styles/design';

const RELEVANT_RESOURCES = new Set(['transactions']);

// Doc §11: the backend's raw `status` filter only accepts created/paid/failed/
// refunded. `refund_pending` is a *derived* effective_status, not a queryable
// raw status — sending it as `?status=refund_pending` would either 400 or
// silently return nothing. We still offer it as a UI option but filter for it
// client-side instead of sending it to the server.
const statusOptions = ['all', 'paid', 'failed', 'refunded', 'refund_pending', 'created'];
const RAW_STATUS_VALUES = new Set(['created', 'paid', 'failed', 'refunded']);

const monthOptions = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

// Backend responses in this codebase aren't always shaped the same way
// (see MyBookingsScreen's parseResponse) — be defensive here too instead of
// assuming response.items always exists.
const parseTransactionsResponse = (res) => {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.transactions)) return res.transactions;
    if (res.data && typeof res.data === 'object') {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data.transactions)) return res.data.transactions;
    }
  }
  return [];
};

const getStatusColor = (status) => {
  switch (status) {
    case 'paid': return C.greenDim;
    case 'failed': return C.redDim;
    case 'refunded': return C.blueDim;
    case 'refund_pending': return C.goldDim;
    default: return C.surfaceHigh;
  }
};
const getStatusTextColor = (status) => {
  switch (status) {
    case 'paid': return C.green;
    case 'failed': return C.red;
    case 'refunded': return C.blue;
    case 'refund_pending': return C.gold;
    default: return C.textMuted;
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
  const [currentYear] = useState(new Date().getFullYear());
  const [invoiceLoading, setInvoiceLoading] = useState({});

  useEffect(() => {
    loadTransactions();

    const handleRefresh = (payload) => {
      const resources = payload?.resources || payload?.keys || [];
      if (resources.some((r) => RELEVANT_RESOURCES.has(r))) {
        loadTransactions(true);
      }
    };
    eventEmitter.on('refreshData', handleRefresh);
    return () => eventEmitter.off('refreshData', handleRefresh);
  }, []);

  const loadTransactions = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const filters = {};
      // Only send a raw status the backend actually recognizes; refund_pending
      // is filtered client-side below since it's a derived effective_status.
      if (selectedStatus !== 'all' && RAW_STATUS_VALUES.has(selectedStatus)) {
        filters.status = selectedStatus;
      }
      if (selectedMonth) filters.month = selectedMonth;
      if (selectedYear) filters.year = selectedYear;
      const response = await getTransactions(filters);
      console.log('[Transactions] raw response:', JSON.stringify(response).slice(0, 500));
      let items = parseTransactionsResponse(response);
      if (selectedStatus === 'refund_pending') {
        items = items.filter((t) => (t.effective_status || t.payment_status) === 'refund_pending');
      }
      setTransactions(items);
    } catch (error) {
      console.log('[Transactions] load failed:', error);
      Alert.alert('Error', error.message || 'Unable to load transactions');
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const onRefresh = () => loadTransactions(true);
  const applyFilters = () => { setFilterModalVisible(false); loadTransactions(); };
  const resetFilters = () => {
    setSelectedStatus('all');
    setSelectedMonth(null);
    setSelectedYear(null);
    setFilterModalVisible(false);
    loadTransactions();
  };

  const handleInvoice = async (bookingId) => {
    setInvoiceLoading(prev => ({ ...prev, [bookingId]: true }));
    try {
      const invoiceData = await getInvoice(bookingId);
      await generateInvoicePDF(invoiceData);
    } catch (error) {
      if (error.code === 'invoice_not_available') {
        Alert.alert('Invoice not ready', 'The invoice is available once this trip is completed and paid.');
      } else if (error.code === 'paid_payment_not_found') {
        Alert.alert('Invoice unavailable', 'No paid payment was found for this booking.');
      } else {
        Alert.alert('Error', error.message || 'Invoice not available for this booking');
      }
    } finally {
      setInvoiceLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const renderTransactionItem = ({ item }) => {
    const effectiveStatus = item.effective_status || item.payment_status;
    const routeName = item.route_name || 'Shuttle';
    const pickupName = item.pickup_stop?.name || 'Pickup';
    const dropoffName = item.dropoff_stop?.name || 'Dropoff';
    const amount = parseFloat(item.amount).toFixed(2);
    const date = new Date(item.created_at).toLocaleDateString();
    const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isCompleted = item.booking_status === 'completed' && item.payment_status === 'paid';
    const isLoading = invoiceLoading[item.booking_id];

    return (
      <TouchableOpacity onPress={() => navigation.navigate('BookingDetail', { bookingId: item.booking_id })} activeOpacity={0.8}>
        <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 20, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[T.bodyMd, { flex: 1 }]}>{routeName}</Text>
            <View style={{ backgroundColor: getStatusColor(effectiveStatus), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 }}>
              <Text style={{ color: getStatusTextColor(effectiveStatus), fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
                {effectiveStatus?.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <Text style={[T.bodySm, { marginBottom: 4 }]}>{pickupName} → {dropoffName}</Text>
          <Text style={[T.bodySm, { color: C.textMuted, marginBottom: 6 }]}>{date} at {time}</Text>
          <Text style={[T.displayMd, { color: C.gold, marginBottom: 4 }]}>₹{amount}</Text>
          {parseFloat(item.total_tax_amount) > 0 && (
            <Text style={[T.bodySm, { color: C.textMuted, marginBottom: 4 }]}>
              incl. GST ₹{parseFloat(item.total_tax_amount).toFixed(2)}
            </Text>
          )}
          {isCompleted && (
            <TouchableOpacity
              onPress={() => handleInvoice(item.booking_id)}
              disabled={isLoading}
              style={{ backgroundColor: C.goldDim, borderRadius: 30, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
            >
              <Ionicons name="document-text-outline" size={16} color={C.gold} />
              <Text style={{ color: C.gold, marginLeft: 6, fontWeight: 'bold', fontSize: 12 }}>{isLoading ? 'Generating...' : 'Download Invoice'}</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="Transactions" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={[T.bodySm, { color: C.textMuted }]}>{transactions.length} transactions</Text>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="filter-outline" size={18} color={C.gold} />
          <Text style={{ color: C.gold, marginLeft: 4, fontWeight: '500' }}>Filter</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.gold} /></View>
      ) : transactions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="receipt-outline" size={60} color={C.textMuted} />
          <Text style={[T.bodyMd, { marginTop: 12 }]}>No transactions found</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.payment_id}
          renderItem={renderTransactionItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
          <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, maxHeight: '80%', borderTopWidth: 1, borderColor: C.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={T.displayMd}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}><Ionicons name="close" size={24} color={C.textPrimary} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={[T.headingSm, { marginBottom: 8 }]}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, flexDirection: 'row' }}>
                {statusOptions.map((status) => (
                  <TouchableOpacity key={status} onPress={() => setSelectedStatus(status)} style={{ backgroundColor: selectedStatus === status ? C.gold : C.surfaceHigh, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, marginRight: 8 }}>
                    <Text style={{ color: selectedStatus === status ? '#000' : C.textPrimary, fontWeight: '500' }}>{status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={[T.headingSm, { marginBottom: 8 }]}>Month</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {monthOptions.map((month) => (
                  <TouchableOpacity key={month.value} onPress={() => setSelectedMonth(selectedMonth === month.value ? null : month.value)} style={{ backgroundColor: selectedMonth === month.value ? C.gold : C.surfaceHigh, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, marginRight: 8 }}>
                    <Text style={{ color: selectedMonth === month.value ? '#000' : C.textPrimary }}>{month.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={[T.headingSm, { marginBottom: 8 }]}>Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <TouchableOpacity key={year} onPress={() => setSelectedYear(selectedYear === year ? null : year)} style={{ backgroundColor: selectedYear === year ? C.gold : C.surfaceHigh, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, marginRight: 8 }}>
                    <Text style={{ color: selectedYear === year ? '#000' : C.textPrimary }}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <TouchableOpacity onPress={resetFilters} style={{ flex: 1, backgroundColor: C.surfaceHigh, paddingVertical: 12, borderRadius: 30, alignItems: 'center' }}>
                  <Text style={{ color: C.textPrimary }}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={applyFilters} style={{ flex: 1, backgroundColor: C.gold, paddingVertical: 12, borderRadius: 30, alignItems: 'center' }}>
                  <Text style={{ color: '#000', fontWeight: 'bold' }}>Apply</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}