import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  createProfile,
  fetchProfile,
  updateProfile,
  uploadProfilePicture,
} from '../services/profileApi';
import { API_BASE_URL } from '../config/api';

// Helper to get full image URL from relative path
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

export default function ProfileScreen({ navigation }) {  // ← added navigation prop
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [initialName, setInitialName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await fetchProfile();
      setProfile(data);
      setNewName(data.full_name);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        setCreateModalVisible(true);
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

 const handleCreateProfile = async () => {
  if (!initialName.trim()) {
    Alert.alert('Error', 'Please enter your full name');
    return;
  }
  setCreating(true);
  try {
    const result = await createProfile(initialName);
    setProfile(result.profile);
    setNewName(result.profile.full_name);
    setCreateModalVisible(false);
    Alert.alert('Success', 'Profile created successfully');
    // After profile creation, navigate to the main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setCreating(false);
  }
};

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setUpdatingName(true);
    try {
      const updated = await updateProfile(newName);
      setProfile(updated.profile);
      setEditModalVisible(false);
      Alert.alert('Success', 'Name updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUpdatingName(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const result = await uploadProfilePicture(uri);
      setProfile(result.profile);
      Alert.alert('Success', 'Profile picture updated');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const menuItems = [
    { icon: 'card-outline', label: 'Payment Methods' },
    { icon: 'card-outline', label: 'RFID Wallet', onPress: () => navigation.navigate('RfidWallet') },
    { icon: 'help-circle-outline', label: 'Help & Support' },
    { icon: 'settings-outline', label: 'Settings' },
    { icon: 'receipt-outline', label: 'Transaction History', onPress: () => navigation.navigate('Transactions') },
    { icon: 'chatbubble-outline', label: 'Support', onPress: () => navigation.navigate('SupportTickets') },
    { icon: 'log-out-outline', label: 'Logout', color: '#ef4444', onPress: logout },
    
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Profile" />
      <ScrollView>
        <View className="items-center py-6 border-b border-gray-800">
          <TouchableOpacity onPress={showImageOptions} disabled={uploading}>
            <View className="relative">
              {profile?.profile_picture_path ? (
                <Image
                  source={{ uri: getImageUrl(profile.profile_picture_path) }}
                  className="w-24 h-24 rounded-full"
                  onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-gray-800 items-center justify-center">
                  <Text className="text-white text-4xl font-bold">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              {uploading && (
                <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-white rounded-full p-1">
                <Ionicons name="camera" size={16} color="#000" />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditModalVisible(true)} className="mt-3 flex-row items-center">
            <Text className="text-white text-xl font-bold">{profile?.full_name || 'User'}</Text>
            <Ionicons name="pencil" size={18} color="#aaa" className="ml-2" />
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm mt-1">{user?.email}</Text>
        </View>

        <View className="mt-4 px-4">
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              className="flex-row items-center py-4 border-b border-gray-800"
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={24} color={item.color || '#fff'} />
              <Text className={`flex-1 text-base ml-3 ${item.color ? 'text-red-500' : 'text-white'}`}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-black text-xl font-bold mb-4">Edit Name</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-3 text-base text-black mb-4"
              value={newName}
              onChangeText={setNewName}
              placeholder="Your full name"
              placeholderTextColor="#999"
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="px-4 py-2 rounded-lg"
              >
                <Text className="text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateName}
                disabled={updatingName}
                className="bg-black px-4 py-2 rounded-lg"
              >
                {updatingName ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Profile Modal (first time) */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-black text-xl font-bold mb-4">Complete Your Profile</Text>
            <Text className="text-gray-600 mb-4">Please enter your full name to continue.</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-3 text-base text-black mb-4"
              value={initialName}
              onChangeText={setInitialName}
              placeholder="Full name"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={handleCreateProfile}
              disabled={creating}
              className="bg-black py-3 rounded-full items-center"
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Create Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}