import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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

const DEFAULT_LATITUDE = -6.2088;
const DEFAULT_LONGITUDE = 106.8456;

const BANK_SAMPAH_LOCATIONS: BankSampah[] = [
  {
    id: 1,
    name: 'Bank Sampah Induk Jakarta Pusat',
    latitude: -6.195,
    longitude: 106.832,
    categories: ['Plastik', 'Kertas', 'Logam'],
    hours: '08:00 - 15:00',
    address: 'Jl. Kali Pasir No.15, Cikini, Jakarta Pusat',
  },
  {
    id: 2,
    name: 'Bank Sampah Melati Bersih',
    latitude: -6.215,
    longitude: 106.855,
    categories: ['Organik', 'Plastik', 'Kaca'],
    hours: '09:00 - 16:00',
    address: 'Jl. Tebet Barat Dalam Raya No.12, Tebet, Jakarta Selatan',
  },
  {
    id: 3,
    name: 'Bank Sampah Hijau Selalu',
    latitude: -6.185,
    longitude: 106.815,
    categories: ['Plastik', 'Kardus', 'Kertas'],
    hours: '08:00 - 14:00',
    address: 'Jl. Kebon Sirih No.45, Menteng, Jakarta Pusat',
  },
  {
    id: 4,
    name: 'Bank Sampah Asri Jaya',
    latitude: -6.235,
    longitude: 106.842,
    categories: ['Logam', 'Kaca', 'Elektronik'],
    hours: '08:00 - 17:00',
    address: 'Jl. Pancoran Timur No.8, Pancoran, Jakarta Selatan',
  },
  {
    id: 5,
    name: 'Bank Sampah Berkah Daur Ulang',
    latitude: -6.202,
    longitude: 106.862,
    categories: ['Plastik', 'Logam', 'Kardus'],
    hours: '09:00 - 15:30',
    address: 'Jl. Matraman Raya No.112, Matraman, Jakarta Timur',
  },
];

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadiusKm = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (earthRadiusKm * c).toFixed(1);
};

export default function MapScreen() {
  const navigation = useNavigation();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [selectedBank, setSelectedBank] = useState<BankSampah | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  useEffect(() => {
    let isMounted = true;

    const resolveLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        if (status !== 'granted') {
          setErrorMsg('Izin lokasi ditolak. Menampilkan peta default.');
          setLoadingLocation(false);
          return;
        }

        const lastKnownLocation = await Location.getLastKnownPositionAsync();
        if (lastKnownLocation && isMounted) {
          setLocation(lastKnownLocation);
          setMapRegion({
            latitude: lastKnownLocation.coords.latitude,
            longitude: lastKnownLocation.coords.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          });
        }

        const currentLocation = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);

        if (!isMounted) return;

        if (!currentLocation) {
          setErrorMsg(lastKnownLocation ? null : 'GPS lambat. Menampilkan peta default.');
          setLoadingLocation(false);
          return;
        }

        setLocation(currentLocation);
        setMapRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        });
      } catch (error) {
        if (isMounted) {
          setErrorMsg('Gagal memuat GPS. Menampilkan peta default.');
        }
      } finally {
        if (isMounted) {
          setLoadingLocation(false);
        }
      }
    };

    resolveLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const openDirections = (bank: BankSampah) => {
    const nativeUrl = Platform.select({
      ios: `maps:0,0?q=${bank.name}@${bank.latitude},${bank.longitude}`,
      android: `geo:${bank.latitude},${bank.longitude}?q=${bank.latitude},${bank.longitude}(${bank.name})`,
    });
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${bank.latitude},${bank.longitude}`;
    const url = nativeUrl || webUrl;

    Linking.canOpenURL(url).then((supported) => {
      Linking.openURL(supported ? url : webUrl);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
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
              onPress={(event) => {
                event.stopPropagation();
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

        {loadingLocation && (
          <View style={styles.locationStatus}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.locationStatusText}>Mencari GPS...</Text>
          </View>
        )}

        {selectedBank && (
          <View style={styles.infoSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleCol}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {selectedBank.name}
                </Text>
                {location && (
                  <Text style={styles.sheetDistance}>
                    Jarak: {getDistance(
                      location.coords.latitude,
                      location.coords.longitude,
                      selectedBank.latitude,
                      selectedBank.longitude
                    )}{' '}
                    km dari Anda
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedBank(null)}>
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
    backgroundColor: '#FFFFFF',
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
    zIndex: 2,
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
    fontWeight: '800',
    color: '#1E4E2C',
    fontFamily: 'GeistSans-Bold',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#E53E3E',
    marginTop: 1,
    textAlign: 'center',
    fontFamily: 'GeistSans-Regular',
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#EAF2EC',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationStatus: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  locationStatusText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
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
    fontWeight: '800',
    color: '#133B1C',
    fontFamily: 'GeistSans-Bold',
  },
  sheetDistance: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'GeistSans-SemiBold',
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
    fontFamily: 'GeistSans-Regular',
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
    fontFamily: 'GeistSans-Regular',
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
    fontFamily: 'GeistSans-Bold',
  },
});
