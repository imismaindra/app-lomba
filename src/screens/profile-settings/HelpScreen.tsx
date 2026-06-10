import React from 'react';
import { Text, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { SettingsLayout, settingsStyles as styles } from './SettingsLayout';

export default function HelpScreen() {
  const { t } = useLanguage();

  return (
    <SettingsLayout title={t('settings.helpTitle')} subtitle={t('settings.helpSubtitle')}>
      <View style={styles.card}>
        <Text style={styles.staticTitle}>Cara memakai aplikasi</Text>
        <Text style={styles.staticText}>
          Masuk ke akun Anda, buka dashboard, lalu gunakan fitur scan saat sudah tersedia untuk mencatat jenis sampah dan
          mendapatkan Eco Poin.
        </Text>
        <Text style={styles.staticTitle}>Masalah login</Text>
        <Text style={styles.staticText}>
          Pastikan email atau username benar, password sesuai, dan backend lokal berjalan di port 5000.
        </Text>
        <Text style={styles.staticTitle}>Poin dan reward</Text>
        <Text style={styles.staticText}>
          Eco Poin akan bertambah dari aktivitas ramah lingkungan dan dapat ditukarkan melalui halaman Eco Poin.
        </Text>
      </View>
    </SettingsLayout>
  );
}
