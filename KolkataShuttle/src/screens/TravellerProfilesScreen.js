import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import {
  getTravellerProfiles,
  createTravellerProfile,
  updateTravellerProfile,
  deleteTravellerProfile,
} from '../services/bookingApi';
import { validateTravellerForm } from '../utils/travellerValidation';
import { C, T } from '../styles/design';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const ProfileCard = ({ profile, onEdit, onDelete }) => {
  const isSelf = profile.is_self;
  const relationship = profile.relationship_label || (isSelf ? 'You' : 'Traveller');
  return (
    <LinearGradient colors={[C.surfaceUp, C.surface]} style={{
      borderRadius: 20, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: C.border,
      flexDirection: 'row', alignItems: 'center',
    }}>
      <View style={{
        width: 52, height: 52, borderRadius: 26, backgroundColor: isSelf ? C.goldDim : C.surfaceHigh,
        borderWidth: 1, borderColor: isSelf ? C.gold : C.border,
        alignItems: 'center', justifyContent: 'center', marginRight: 16,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: isSelf ? C.gold : C.textPrimary }}>
          {getInitials(profile.full_name)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Text style={T.bodyLg}>{profile.full_name}</Text>
          {isSelf && (
            <View style={{ backgroundColor: C.goldDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.gold }}>YOU</Text>
            </View>
          )}
          {relationship && !isSelf && <Text style={[T.bodySm, { color: C.textMuted }]}>{relationship}</Text>}
        </View>
        <Text style={T.bodySm}>{profile.phone}</Text>
        {profile.email && <Text style={T.bodySm}>{profile.email}</Text>}
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={() => onEdit(profile)}><Ionicons name="pencil-outline" size={20} color={C.textSecondary} /></TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(profile)}><Ionicons name="trash-outline" size={20} color={C.red} /></TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default function TravellerProfilesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', relationship_label: '', is_self: false });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    try {
      const res = await getTravellerProfiles(true);
      setProfiles(res.items || []);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setEditingProfile(null);
    setForm({ full_name: '', phone: '', email: '', relationship_label: '', is_self: false });
    setFormErrors({});
    setModalVisible(true);
  };

  const openEditModal = (profile) => {
    setEditingProfile(profile);
    setForm({
      full_name: profile.full_name,
      phone: profile.phone,
      email: profile.email || '',
      relationship_label: profile.relationship_label || '',
      is_self: profile.is_self,
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const handleSave = async () => {
    const { valid, errors } = validateTravellerForm(form);
    setFormErrors(errors);
    if (!valid) return;
    setSubmitting(true);
    try {
      if (editingProfile) {
        await updateTravellerProfile(editingProfile.id, form);
        Alert.alert('Updated', `${form.full_name} updated`);
      } else {
        await createTravellerProfile(form);
        Alert.alert('Added', `${form.full_name} added to your profiles`);
      }
      setModalVisible(false);
      loadProfiles();
    } catch (err) {
      if (err.code === 'validation_error' && err.fields?.length) {
        // Map 422 field errors back onto the form inline (doc §9 checklist).
        const mapped = {};
        err.fields.forEach((f) => {
          if (f.path.endsWith('phone')) mapped.phone = f.message;
          else if (f.path.endsWith('email')) mapped.email = f.message;
          else if (f.path.endsWith('full_name')) mapped.full_name = f.message;
        });
        setFormErrors(mapped);
        Alert.alert('Check traveller details', err.message);
      } else {
        Alert.alert('Error', err.message);
      }
    }
    finally { setSubmitting(false); }
  };

  const handleDelete = (profile) => {
    Alert.alert('Remove traveller', `Remove ${profile.full_name} from your saved profiles?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await deleteTravellerProfile(profile.id); loadProfiles(); }
        catch (err) { Alert.alert('Error', err.message); }
      } }
    ]);
  };

  if (loading) return <View style={{ flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={C.gold} /></View>;

  return (
    <View style={{ flex:1, backgroundColor:C.bg, paddingTop: insets.top }}>
      <Header title="Travellers" showBack />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity onPress={openCreateModal} style={{ marginBottom: 20 }}>
          <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:C.border, gap:8 }}>
            <Ionicons name="person-add-outline" size={20} color={C.gold} />
            <Text style={[T.bodyMd, { color: C.gold }]}>Add a traveller</Text>
          </LinearGradient>
        </TouchableOpacity>
        {profiles.length === 0 ? (
          <View style={{ alignItems:'center', marginTop:40 }}>
            <Ionicons name="people-outline" size={60} color={C.textMuted} />
            <Text style={[T.bodyMd, { marginTop:12, color:C.textSecondary }]}>No saved travellers</Text>
            <Text style={[T.bodySm, { marginTop:4, textAlign:'center' }]}>Add profiles to quickly assign seats</Text>
          </View>
        ) : (
          profiles.map(profile => <ProfileCard key={profile.id} profile={profile} onEdit={openEditModal} onDelete={handleDelete} />)
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
          <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'center', alignItems:'center', padding:24 }}>
            <LinearGradient colors={[C.surface, C.surfaceUp]} style={{ borderRadius:28, padding:24, width:'100%', borderWidth:1, borderColor:C.border }}>
              <Text style={T.displayMd}>{editingProfile ? 'Edit' : 'Add'} traveller</Text>
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={C.textMuted} value={form.full_name} onChangeText={t => setForm({...form, full_name:t})} maxLength={120} />
              {formErrors.full_name && <Text style={styles.errorText}>{formErrors.full_name}</Text>}
              <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={C.textMuted} value={form.phone} onChangeText={t => setForm({...form, phone:t})} keyboardType="phone-pad" maxLength={20} />
              {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}
              <TextInput style={styles.input} placeholder="Email (optional)" placeholderTextColor={C.textMuted} value={form.email} onChangeText={t => setForm({...form, email:t})} autoCapitalize="none" maxLength={255} />
              {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
              <TextInput style={styles.input} placeholder="Relationship (e.g., Brother, Mother)" placeholderTextColor={C.textMuted} value={form.relationship_label} onChangeText={t => setForm({...form, relationship_label:t})} maxLength={80} />
              <TouchableOpacity onPress={() => setForm({...form, is_self: !form.is_self})} style={{ flexDirection:'row', alignItems:'center', marginVertical:12 }}>
                <Ionicons name={form.is_self ? 'checkbox' : 'square-outline'} size={20} color={C.gold} />
                <Text style={[T.bodySm, { marginLeft:8 }]}>This is me (self)</Text>
              </TouchableOpacity>
              <View style={{ flexDirection:'row', gap:12, marginTop:16 }}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex:1, backgroundColor:C.surfaceHigh, borderRadius:16, paddingVertical:12, alignItems:'center' }}>
                  <Text style={T.bodyMd}>Cancel</Text>
                </TouchableOpacity>
                <CustomButton title={submitting ? 'Saving...' : 'Save'} onPress={handleSave} disabled={submitting} style={{ flex:1 }} />
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = {
  input: { backgroundColor: C.surfaceUp, borderWidth:1, borderColor:C.border, borderRadius:14, padding:12, color:C.textPrimary, marginBottom:12 },
  errorText: { color: C.red, fontSize: 12, marginTop: -8, marginBottom: 10 },
};