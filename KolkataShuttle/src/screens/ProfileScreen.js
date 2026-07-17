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
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  createProfile,
  fetchProfile,
  updateProfile,
  uploadProfilePicture,
} from '../services/profileApi';
import { API_BASE_URL } from '../config/api';
import { C, T } from '../styles/design';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

export default function ProfileScreen({ navigation }) {
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
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
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
    if (!result.canceled) uploadImage(result.assets[0].uri);
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
    if (!result.canceled) uploadImage(result.assets[0].uri);
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
    // { icon: 'card-outline', label: 'Payment Methods' },
    { icon: 'card-outline', label: 'RFID Wallet', onPress: () => navigation.navigate('RfidWallet') },
    // { icon: 'settings-outline', label: 'Settings' },
    { icon: 'receipt-outline', label: 'Transaction History', onPress: () => navigation.navigate('Transactions') },
    { icon: 'chatbubble-outline', label: 'Support', onPress: () => navigation.navigate('SupportTickets') },
    { icon: 'log-out-outline', label: 'Logout', color: C.red, onPress: logout },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="Profile" />
      <ScrollView>
        <View style={{ alignItems: 'center', paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <TouchableOpacity onPress={showImageOptions} disabled={uploading}>
            <View style={{ position: 'relative' }}>
              {profile?.profile_picture_path ? (
                <Image source={{ uri: getImageUrl(profile.profile_picture_path) }} style={{ width: 96, height: 96, borderRadius: 48 }} />
              ) : (
                <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ fontSize: 36, fontWeight: 'bold', color: C.gold }}>{profile?.full_name?.charAt(0).toUpperCase() || 'U'}</Text>
                </LinearGradient>
              )}
              {uploading && (
                <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color={C.gold} />
                </View>
              )}
              <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: C.gold, borderRadius: 20, padding: 4 }}>
                <Ionicons name="camera" size={14} color="#000" />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <Text style={[T.displayMd, { marginRight: 6 }]}>{profile?.full_name || 'User'}</Text>
            <Ionicons name="pencil" size={16} color={C.textMuted} />
          </TouchableOpacity>
          <Text style={[T.bodySm, { marginTop: 4, color: C.textSecondary }]}>{user?.email}</Text>
        </View>

        <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={item.onPress}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}
            >
              <Ionicons name={item.icon} size={24} color={item.color || C.gold} />
              <Text style={[T.bodyMd, { flex: 1, marginLeft: 12, color: item.color || C.textPrimary }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 24, padding: 20, width: '100%', borderWidth: 1, borderColor: C.border }}>
            <Text style={[T.displayMd, { marginBottom: 16 }]}>Edit Name</Text>
            <TextInput
              style={{ backgroundColor: C.surfaceHigh, borderRadius: 14, padding: 12, color: C.textPrimary, marginBottom: 20, borderWidth: 1, borderColor: C.border }}
              value={newName}
              onChangeText={setNewName}
              placeholder="Your full name"
              placeholderTextColor={C.textMuted}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ paddingHorizontal: 16, paddingVertical: 8, marginRight: 12 }}>
                <Text style={{ color: C.textMuted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateName} disabled={updatingName} style={{ backgroundColor: C.gold, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 }}>
                {updatingName ? <ActivityIndicator size="small" color="#000" /> : <Text style={{ color: '#000', fontWeight: 'bold' }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      <Modal visible={createModalVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 24, padding: 20, width: '100%', borderWidth: 1, borderColor: C.border }}>
            <Text style={[T.displayMd, { marginBottom: 12 }]}>Complete Your Profile</Text>
            <Text style={[T.bodySm, { marginBottom: 20, color: C.textSecondary }]}>Please enter your full name to continue.</Text>
            <TextInput
              style={{ backgroundColor: C.surfaceHigh, borderRadius: 14, padding: 12, color: C.textPrimary, marginBottom: 20, borderWidth: 1, borderColor: C.border }}
              value={initialName}
              onChangeText={setInitialName}
              placeholder="Full name"
              placeholderTextColor={C.textMuted}
            />
            <TouchableOpacity onPress={handleCreateProfile} disabled={creating} style={{ backgroundColor: C.gold, borderRadius: 30, paddingVertical: 12, alignItems: 'center' }}>
              {creating ? <ActivityIndicator size="small" color="#000" /> : <Text style={{ color: '#000', fontWeight: 'bold' }}>Create Profile</Text>}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}