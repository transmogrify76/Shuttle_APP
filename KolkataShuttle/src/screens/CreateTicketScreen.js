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
import { C, T } from '../styles/design';

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
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header title="New Support Ticket" showBack />
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
          <Text style={[T.headingSm, { marginBottom: 8 }]}>Subject</Text>
          <TextInput
            style={{
              backgroundColor: C.surfaceUp,
              borderRadius: 16,
              padding: 16,
              color: C.textPrimary,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: C.border,
            }}
            placeholder="Brief summary of your issue"
            placeholderTextColor={C.textMuted}
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={[T.headingSm, { marginBottom: 8 }]}>Description</Text>
          <TextInput
            style={{
              backgroundColor: C.surfaceUp,
              borderRadius: 16,
              padding: 16,
              color: C.textPrimary,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: C.border,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
            placeholder="Please provide detailed information"
            placeholderTextColor={C.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
          />

          <Text style={[T.headingSm, { marginBottom: 8 }]}>Attachment (optional)</Text>
          {attachment ? (
            <View
              style={{
                backgroundColor: C.surfaceUp,
                borderRadius: 16,
                padding: 12,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="image-outline" size={20} color={C.textSecondary} />
                <Text style={[T.bodySm, { marginLeft: 8, color: C.textSecondary }]}>File selected</Text>
              </View>
              <TouchableOpacity onPress={removeAttachment}>
                <Ionicons name="close-circle" size={22} color={C.red} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              style={{
                backgroundColor: C.surfaceUp,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: C.border,
                borderStyle: 'dashed',
              }}
            >
              <Ionicons name="cloud-upload-outline" size={24} color={C.textSecondary} />
              <Text style={[T.bodySm, { marginLeft: 8, color: C.textSecondary }]}>Upload image (JPG/PNG)</Text>
            </TouchableOpacity>
          )}

          <AnimatedButton
            title={loading ? 'Creating...' : 'Submit Ticket'}
            onPress={handleSubmit}
            disabled={loading}
            style={{ marginBottom: 40 }}
            buttonColor="gold"
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}