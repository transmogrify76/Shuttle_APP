import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/Header';
import AnimatedButton from '../components/AnimatedButton';
import { createSupportTicket } from '../services/supportApi';

export default function CreateTicketScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setAttachment(result.assets[0].uri);
    }
  };

  const removeAttachment = () => setAttachment(null);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe your issue');
      return;
    }
    setLoading(true);
    try {
      await createSupportTicket(subject, description, attachment);
      Alert.alert('Success', 'Support ticket created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
    >
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <Header title="New Support Ticket" />
        <ScrollView className="flex-1 px-5 pt-5">
          <Text className="text-white font-medium mb-2">Subject</Text>
          <TextInput
            className="bg-gray-900 rounded-xl p-4 text-white mb-4"
            placeholder="Brief summary of your issue"
            placeholderTextColor="#666"
            value={subject}
            onChangeText={setSubject}
          />

          <Text className="text-white font-medium mb-2">Description</Text>
          <TextInput
            className="bg-gray-900 rounded-xl p-4 text-white mb-4"
            placeholder="Please provide detailed information"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Text className="text-white font-medium mb-2">Attachment (optional)</Text>
          {attachment ? (
            <View className="bg-gray-900 rounded-xl p-3 mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="image-outline" size={20} color="#aaa" />
                <Text className="text-gray-400 ml-2">File selected</Text>
              </View>
              <TouchableOpacity onPress={removeAttachment}>
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              className="bg-gray-900 rounded-xl p-4 mb-4 flex-row items-center justify-center border border-dashed border-gray-700"
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#aaa" />
              <Text className="text-gray-400 ml-2">Upload image (JPG/PNG)</Text>
            </TouchableOpacity>
          )}

          <AnimatedButton
            title={loading ? 'Creating...' : 'Submit Ticket'}
            onPress={handleSubmit}
            disabled={loading}
            style={{ marginBottom: 40 }}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}