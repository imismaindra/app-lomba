import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

interface BankSampah {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  categories: string[];
  hours: string;
  address: string;
}

const DEFAULT_LATITUDE = -6.2088; // Jakarta Center
const DEFAULT_LONGITUDE = 106.8456;

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
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<BankSampah | null>(null);

  const [mapRegion, setMapRegion] = useState({
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Izin lokasi ditolak. Menampilkan peta default.');
          setLoading(false);
          return;
        }

        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc);
        setMapRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        });
      } catch (error) {
        setErrorMsg('Gagal memuat GPS. Menampilkan peta default.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openDirections = (bank: BankSampah) => {
    const scheme = Platform.select({
      ios: `maps:0,0?q=${bank.name}@${bank.latitude},${bank.longitude}`,
      android: `geo:${bank.latitude},${bank.longitude}?q=${bank.latitude},${bank.longitude}(${bank.name})`,
    });
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${bank.latitude},${bank.longitude}`;
    const url = scheme || webUrl;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(webUrl);
      }
    });
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d.toFixed(1); // returns in km
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
          <Text style={styles.headerTitle}>Peta Bank Sampah</Text>
          {errorMsg && <Text style={styles.headerSubtitle}>{errorMsg}</Text>}
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Mencari koordinat GPS Anda...</Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            region={mapRegion}
            showsUserLocation={!!location}
            showsMyLocationButton={!!location}
            onPress={() => setSelectedBank(null)}
          >
            {BANK_SAMPAH_LOCATIONS.map((bank) => (
              <Marker
                key={bank.id}
                coordinate={{ latitude: bank.latitude, longitude: bank.longitude }}
                title={bank.name}
                description={bank.address}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedBank(bank);
                }}
              >
                <View style={styles.customMarker}>
                  <View style={styles.markerCircle}>
                    <Ionicons name="trash" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.markerArrow} />
                </View>
              </Marker>
            ))}
          </MapView>
        )}

        {/* Floating Info Sheet for Selected Bank Sampah */}
        {selectedBank && (
          <View style={styles.infoSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleCol}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {selectedBank.name}
                </Text>
                {location && (
                  <Text style={styles.sheetDistance}>
                    📍 Jarak: {getDistance(
                      location.coords.latitude,
                      location.coords.longitude,
                      selectedBank.latitude,
                      selectedBank.longitude
                    )}{' '}
                    km dari Anda
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedBank(null)}
              >
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetAddress} numberOfLines={2}>
              {selectedBank.address}
            </Text>

            <View style={styles.divider} />

            <View style={styles.sheetDetailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color="#64748B" />
                <Text style={styles.detailText}>{selectedBank.hours}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="leaf-outline" size={16} color="#64748B" />
                <Text style={styles.detailText} numberOfLines={1}>
                  Menerima: {selectedBank.categories.join(', ')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.navigateButton}
              activeOpacity={0.8}
              onPress={() => openDirections(selectedBank)}
            >
              <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
              <Text style={styles.navigateButtonText}>Petunjuk Arah (Maps)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    color: '#E53E3E',
    marginTop: 1,
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#10B981',
    marginTop: -2,
  },
  infoSheet: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sheetTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#133B1C',
  },
  sheetDistance: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetAddress: {
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
  sheetDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  navigateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E4E2C',
    borderRadius: 16,
    height: 48,
    gap: 8,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
