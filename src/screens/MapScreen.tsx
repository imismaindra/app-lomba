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
import { WebView } from 'react-native-webview';
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

// Cache OSM results and requests globally to survive hot-reloads and screen unmounts,
// preventing Overpass API HTTP 429 Too Many Requests rate-limiting.
let cachedRealBanks: BankSampah[] = [];
let lastFetchTimeGlobal = 0;
let lastFetchCoordsGlobal: { latitude: number; longitude: number } | null = null;
let isFetchingGlobal = false;

export default function MapScreen() {
  const navigation = useNavigation();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [selectedBank, setSelectedBank] = useState<BankSampah | null>(null);
  const [cityName, setCityName] = useState<string>('Anda');
  const [realBanks, setRealBanks] = useState<BankSampah[]>(cachedRealBanks);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  const fetchRealBanks = async (lat: number, lon: number, currentCity: string) => {
    if (isFetchingGlobal) {
      console.log('Skipping Overpass API fetch: request already in progress.');
      return;
    }

    if (lastFetchCoordsGlobal) {
      const dist = parseFloat(getDistance(lat, lon, lastFetchCoordsGlobal.latitude, lastFetchCoordsGlobal.longitude));
      const timeDiff = Date.now() - lastFetchTimeGlobal;

      // Skip fetching if within 2.0 km and fetched less than 5 minutes ago
      if (dist < 2.0 && timeDiff < 5 * 60 * 1000) {
        console.log(`Skipping Overpass API fetch: distance is ${dist} km (< 2.0 km) and last fetch was ${Math.round(timeDiff / 1000)}s ago.`);
        return;
      }
    }

    try {
      isFetchingGlobal = true;
      setLoadingBanks(true);

      // Record coordinate and timestamp of fetch
      lastFetchTimeGlobal = Date.now();
      lastFetchCoordsGlobal = { latitude: lat, longitude: lon };

      const query = `
        [out:json][timeout:15];
        (
          node["amenity"="recycling"](around:15000, ${lat}, ${lon});
          way["amenity"="recycling"](around:15000, ${lat}, ${lon});
          node[~"name|description|amenity"~"bank sampah|daur ulang|rongsok|waste",i](around:15000, ${lat}, ${lon});
          way[~"name|description|amenity"~"bank sampah|daur ulang|rongsok|waste",i](around:15000, ${lat}, ${lon});
        );
        out body center;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'CyberWasteApp/1.0 (contact: support@cyberwasteapp.site)'
        },
        body: `data=${encodeURIComponent(query)}`
      });
      
      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.elements && data.elements.length > 0) {
        const banks: BankSampah[] = data.elements.map((el: any, idx: number) => {
          const tags = el.tags || {};
          const name = tags.name || tags.description || `Bank Sampah #${idx + 1}`;
          const address = tags['addr:full'] || tags['addr:street'] || `Sekitar ${currentCity}`;
          
          let categories = ['Plastik', 'Kertas', 'Logam'];
          if (tags.recycling) {
            const parsedCategories = Object.keys(tags)
              .filter(k => k.startsWith('recycling:') && tags[k] === 'yes')
              .map(k => k.replace('recycling:', ''))
              .map(k => k.charAt(0).toUpperCase() + k.slice(1));
            if (parsedCategories.length > 0) {
              categories = parsedCategories;
            }
          }

          return {
            id: el.id,
            name,
            latitude: el.lat || (el.center && el.center.lat) || lat,
            longitude: el.lon || (el.center && el.center.lon) || lon,
            categories,
            hours: tags.opening_hours || '08:00 - 15:00',
            address,
          };
        });
        cachedRealBanks = banks;
        setRealBanks(banks);
      } else {
        cachedRealBanks = [];
        setRealBanks([]);
      }
    } catch (error) {
      console.error('Error fetching real banks:', error);
      // Reset variables so that a retry can occur immediately on next update/mount
      lastFetchTimeGlobal = 0;
      lastFetchCoordsGlobal = null;
      cachedRealBanks = [];
      setRealBanks([]);
    } finally {
      isFetchingGlobal = false;
      setLoadingBanks(false);
    }
  };

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
          let city = 'Anda';
          try {
            const geocode = await Location.reverseGeocodeAsync({
              latitude: lastKnownLocation.coords.latitude,
              longitude: lastKnownLocation.coords.longitude,
            });
            if (geocode && geocode.length > 0 && isMounted) {
              city = geocode[0].city || geocode[0].subregion || geocode[0].district || 'Anda';
              setCityName(city);
            }
          } catch (geoError) {
            console.log('Reverse geocoding error:', geoError);
          }
          if (isMounted) {
            fetchRealBanks(lastKnownLocation.coords.latitude, lastKnownLocation.coords.longitude, city);
          }
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
        let city = 'Anda';
        try {
          const geocode = await Location.reverseGeocodeAsync({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
          if (geocode && geocode.length > 0 && isMounted) {
            city = geocode[0].city || geocode[0].subregion || geocode[0].district || 'Anda';
            setCityName(city);
          }
        } catch (geoError) {
          console.log('Reverse geocoding error:', geoError);
        }
        if (isMounted) {
          fetchRealBanks(currentLocation.coords.latitude, currentLocation.coords.longitude, city);
        }
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

  const displayLocations = React.useMemo(() => {
    if (realBanks.length > 0) {
      return realBanks;
    }

    if (location) {
      const userLat = location.coords.latitude;
      const userLon = location.coords.longitude;

      return [
        {
          id: 101,
          name: `Bank Sampah ${cityName} Bersih (Demo)`,
          latitude: userLat + 0.005,
          longitude: userLon + 0.008,
          categories: ['Plastik', 'Kertas', 'Logam'],
          hours: '08:00 - 15:00',
          address: `Jl. Lestari Hijau No. 10, ${cityName}`,
        },
        {
          id: 102,
          name: `Bank Sampah Delta ${cityName} (Demo)`,
          latitude: userLat - 0.008,
          longitude: userLon - 0.004,
          categories: ['Organik', 'Plastik', 'Kaca'],
          hours: '09:00 - 16:00',
          address: `Jl. Eco Asri No. 45, ${cityName}`,
        },
        {
          id: 103,
          name: `Pusat Daur Ulang ${cityName} (Demo)`,
          latitude: userLat + 0.009,
          longitude: userLon - 0.006,
          categories: ['Logam', 'Kaca', 'Elektronik'],
          hours: '08:00 - 17:00',
          address: `Jl. Raya Konservasi No. 88, ${cityName}`,
        },
      ];
    }
    return [];
  }, [location, cityName, realBanks]);

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

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
      <style>
        body, html, #map {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background-color: #EAF2EC;
        }
        .user-location-marker {
          background: none;
          border: none;
        }
        .custom-div-icon {
          background: #10B981;
          border: 2px solid #FFFFFF;
          border-radius: 50%;
          color: white;
          text-align: center;
          line-height: 26px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.16);
          width: 30px;
          height: 30px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false
        }).setView([${mapRegion.latitude}, ${mapRegion.longitude}], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var locations = ${JSON.stringify(displayLocations)};
        
        locations.forEach(function(bank) {
          var greenMarker = L.divIcon({
            className: 'custom-div-icon',
            html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16" style="margin-top: 5px;"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          var marker = L.marker([bank.latitude, bank.longitude], { icon: greenMarker }).addTo(map);
          
          marker.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SELECT_BANK',
              id: bank.id
            }));
          });
        });

        map.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'DESELECT_BANK'
          }));
        });

        ${location ? `
          L.marker([${location.coords.latitude}, ${location.coords.longitude}], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: '<div style="background-color: #2196F3; width: 16px; height: 16px; border-radius: 8px; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4); outline: none;"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          }).addTo(map);
        ` : ''}
      </script>
    </body>
    </html>
  `;

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
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.map}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'SELECT_BANK') {
                const bank = displayLocations.find((b) => b.id === data.id);
                if (bank) {
                  setSelectedBank(bank);
                }
              } else if (data.type === 'DESELECT_BANK') {
                setSelectedBank(null);
              }
            } catch (e) {
              console.error('WebView map error:', e);
            }
          }}
        />

        {(loadingLocation || loadingBanks) && (
          <View style={styles.locationStatus}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.locationStatusText}>
              {loadingLocation ? 'Mencari GPS...' : 'Mencari Bank Sampah...'}
            </Text>
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
    ...StyleSheet.absoluteFill,
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
