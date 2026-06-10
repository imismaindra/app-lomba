import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../../../config';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Field, SettingsLayout, settingsStyles as styles } from './SettingsLayout';

export default function EditProfileScreen() {
  const { user, token, checkSession } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert('Data belum lengkap', 'Username dan email wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, email }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert('Gagal', data.error || 'Profil gagal diperbarui.');
        return;
      }

      await checkSession();
      Alert.alert('Berhasil', 'Profil berhasil diperbarui.');
    } catch (error) {
      Alert.alert('Gagal', 'Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsLayout title={t('settings.editProfileTitle')} subtitle={t('settings.editProfileSubtitle')}>
      <View style={styles.card}>
        <Field label="Username" value={username} onChangeText={setUsername} placeholder="Username" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          keyboardType="email-address"
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Simpan Profil</Text>}
        </TouchableOpacity>
      </View>
    </SettingsLayout>
  );
}
