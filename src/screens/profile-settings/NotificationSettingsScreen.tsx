import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Switch, Text, View } from 'react-native';
import { API_URL } from '../../../config';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SettingsLayout, settingsStyles as styles } from './SettingsLayout';

type SettingsKey = 'scanReminders' | 'rewardUpdates' | 'ecoTips' | 'appUpdates';

interface NotificationSettings {
  scanReminders: boolean;
  rewardUpdates: boolean;
  ecoTips: boolean;
  appUpdates: boolean;
}

export default function NotificationSettingsScreen() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<NotificationSettings>({
    scanReminders: true,
    rewardUpdates: true,
    ecoTips: true,
    appUpdates: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/notification-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setSettings(data.settings);
        }
      } catch (error) {
        Alert.alert('Gagal', 'Tidak dapat memuat pengaturan notifikasi.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  const updateSetting = async (key: SettingsKey, value: boolean) => {
    const previousSettings = settings;
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nextSettings),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        Alert.alert('Gagal', data.error || 'Pengaturan gagal disimpan.');
        setSettings(previousSettings);
      }
    } catch (error) {
      Alert.alert('Gagal', 'Tidak dapat menyimpan pengaturan notifikasi.');
      setSettings(previousSettings);
    } finally {
      setSaving(false);
    }
  };

  const rows: Array<{ key: SettingsKey; title: string; subtitle: string }> = [
    { key: 'scanReminders', title: 'Pengingat Scan', subtitle: 'Ingatkan untuk scan sampah harian.' },
    { key: 'rewardUpdates', title: 'Update Reward', subtitle: 'Kabar reward dan penukaran poin.' },
    { key: 'ecoTips', title: 'Tips Lingkungan', subtitle: 'Tips singkat pengelolaan sampah.' },
    { key: 'appUpdates', title: 'Update Aplikasi', subtitle: 'Informasi fitur dan perbaikan aplikasi.' },
  ];

  return (
    <SettingsLayout title={t('settings.notificationsTitle')} subtitle={t('settings.notificationsSubtitle')}>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color="#10B981" />
        ) : (
          rows.map((row) => (
            <View key={row.key} style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
              </View>
              <Switch
                value={settings[row.key]}
                onValueChange={(value) => updateSetting(row.key, value)}
                disabled={saving}
                thumbColor={settings[row.key] ? '#10B981' : '#F8FAFC'}
                trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              />
            </View>
          ))
        )}
      </View>
    </SettingsLayout>
  );
}
