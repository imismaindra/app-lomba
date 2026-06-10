import React from 'react';
import { Text, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { SettingsLayout, settingsStyles as styles } from './SettingsLayout';

export default function AboutAppScreen() {
  const { t } = useLanguage();

  return (
    <SettingsLayout title={t('settings.aboutTitle')} subtitle={t('settings.aboutSubtitle')}>
      <View style={styles.card}>
        <Text style={styles.staticTitle}>Echo Tech</Text>
        <Text style={styles.staticText}>
          Echo Tech adalah aplikasi klasifikasi sampah berbasis teknologi yang membantu pengguna memahami jenis sampah,
          mengukur dampak lingkungan, dan membangun kebiasaan daur ulang.
        </Text>
        <Text style={styles.staticTitle}>Fokus aplikasi</Text>
        <Text style={styles.staticText}>
          Aplikasi ini menggabungkan autentikasi, dashboard, riwayat, Eco Poin, pengaturan akun, dan fondasi untuk fitur
          klasifikasi sampah AI.
        </Text>
      </View>
    </SettingsLayout>
  );
}
