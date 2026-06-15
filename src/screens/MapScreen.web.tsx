import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface BankSampah {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  categories: string[];
  hours: string;
  address: string;
}

const BANK_SAMPAH_LOCATIONS: BankSampah[] = [
  {
    id: 1,
    name: 'Bank Sampah Induk Jakarta Pusat',
    latitude: -6.1950,
    longitude: 106.8320,
    categories: ['Plastik', 'Kertas', 'Logam'],
    hours: '08:00 - 15:00',
    address: 'Jl. Kali Pasir No.15, Cikini, Jakarta Pusat',
  },
  {
    id: 2,
    name: 'Bank Sampah Melati Bersih',
    latitude: -6.2150,
    longitude: 106.8550,
    categories: ['Organik', 'Plastik', 'Kaca'],
    hours: '09:00 - 16:00',
    address: 'Jl. Tebet Barat Dalam Raya No.12, Tebet, Jakarta Selatan',
  },
  {
    id: 3,
    name: 'Bank Sampah Hijau Selalu',
    latitude: -6.1850,
    longitude: 106.8150,
    categories: ['Plastik', 'Kardus', 'Kertas'],
    hours: '08:00 - 14:00',
    address: 'Jl. Kebon Sirih No.45, Menteng, Jakarta Pusat',
  },
  {
    id: 4,
    name: 'Bank Sampah Asri Jaya',
    latitude: -6.2350,
    longitude: 106.8420,
    categories: ['Logam', 'Kaca', 'Elektronik'],
    hours: '08:00 - 17:00',
    address: 'Jl. Pancoran Timur No.8, Pancoran, Jakarta Selatan',
  },
  {
    id: 5,
    name: 'Bank Sampah Berkah Daur Ulang',
    latitude: -6.2020,
    longitude: 106.8620,
    categories: ['Plastik', 'Logam', 'Kardus'],
    hours: '09:00 - 15:30',
    address: 'Jl. Matraman Raya No.112, Matraman, Jakarta Timur',
  },
];

export default function MapScreen() {
  const navigation = useNavigation();
  const [selectedBank, setSelectedBank] = useState<BankSampah | null>(null);

  const openDirections = (bank: BankSampah) => {
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${bank.latitude},${bank.longitude}`;
    Linking.openURL(webUrl);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FAF6" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#1E4E2C" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Peta Bank Sampah (Web)</Text>
          <Text style={styles.headerSubtitle}>Tampilan peta dioptimalkan untuk perangkat mobile</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={24} color="#1E4E2C" />
          <Text style={styles.infoBannerText}>
            Fitur peta interaktif menggunakan GPS & peta native berjalan optimal pada aplikasi Android dan iOS. Di versi Web, kami menyediakan daftar lokasi bank sampah terintegrasi berikut.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Daftar Bank Sampah Terdekat</Text>

        <View style={styles.gridContainer}>
          {BANK_SAMPAH_LOCATIONS.map((bank) => (
            <TouchableOpacity
              key={bank.id}
              style={[
                styles.bankCard,
                selectedBank?.id === bank.id && styles.selectedBankCard
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedBank(bank)}
            >
              <View style={styles.bankHeader}>
                <Ionicons name="trash-outline" size={22} color="#10B981" />
                <Text style={styles.bankName}>{bank.name}</Text>
              </View>
              <Text style={styles.bankAddress}>{bank.address}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={14} color="#64748B" />
                  <Text style={styles.detailText}>{bank.hours}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="leaf-outline" size={14} color="#64748B" />
                  <Text style={styles.detailText}>Menerima: {bank.categories.join(', ')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => openDirections(bank)}
              >
                <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
                <Text style={styles.navigateButtonText}>Buka Google Maps</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4FAF6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E4E2C',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#A3E2B6',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#133B1C',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#133B1C',
    marginBottom: 16,
  },
  gridContainer: {
    gap: 16,
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  selectedBankCard: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E4E2C',
  },
  bankAddress: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  navigateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E4E2C',
    borderRadius: 12,
    height: 38,
    gap: 6,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
