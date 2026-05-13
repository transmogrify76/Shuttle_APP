import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import LandingScreen from '../screens/LandingScreen';
import EmailEntryScreen from '../screens/EmailEntryScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import SeatSelectionScreen from '../screens/SeatSelectionScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import SupportTicketsScreen from '../screens/SupportTicketsScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import CreateTicketScreen from '../screens/CreateTicketScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
// RFID Screens
import RfidWalletScreen from '../screens/RfidWalletScreen';
import RfidLedgerScreen from '../screens/RfidLedgerScreen';
import RfidRechargeScreen from '../screens/RfidRechargeScreen';
import RfidRechargeHistoryScreen from '../screens/RfidRechargeHistoryScreen';
import RfidRidesScreen from '../screens/RfidRidesScreen';
import RfidRideDetailScreen from '../screens/RfidRideDetailScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
          <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
          <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
          <Stack.Screen name="SupportTickets" component={SupportTicketsScreen} />
          <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
          <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Transactions" component={TransactionsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          {/* RFID screens */}
          <Stack.Screen name="RfidWallet" component={RfidWalletScreen} />
          <Stack.Screen name="RfidLedger" component={RfidLedgerScreen} />
          <Stack.Screen name="RfidRecharge" component={RfidRechargeScreen} />
          <Stack.Screen name="RfidRechargeHistory" component={RfidRechargeHistoryScreen} />
          <Stack.Screen name="RfidRides" component={RfidRidesScreen} />
          <Stack.Screen name="RfidRideDetail" component={RfidRideDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="EmailEntry" component={EmailEntryScreen} />
          <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}