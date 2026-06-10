import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../../../config';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Field, SettingsLayout, settingsStyles as styles } from './SettingsLayout';

export default function ChangePasswordScreen() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Data belum lengkap', 'Isi password saat ini dan password baru.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password tidak cocok', 'Password baru dan konfirmasi harus sama.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert('Gagal', data.error || 'Password gagal diperbarui.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Berhasil', 'Password berhasil diperbarui.');
    } catch (error) {
      Alert.alert('Gagal', 'Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsLayout title={t('settings.changePasswordTitle')} subtitle={t('settings.changePasswordSubtitle')}>
      <View style={styles.card}>
        <Field
          label="Password Saat Ini"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Password saat ini"
          secureTextEntry
        />
        <Field
          label="Password Baru"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Minimal 6 karakter"
          secureTextEntry
        />
        <Field
          label="Konfirmasi Password Baru"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Ulangi password baru"
          secureTextEntry
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Simpan Password</Text>}
        </TouchableOpacity>
      </View>
    </SettingsLayout>
  );
}
