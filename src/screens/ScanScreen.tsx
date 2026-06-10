import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../../config';
import { useAuth } from '../context/AuthContext';
import { addScanPoints } from '../store/ecoPointSlice';
import { useAppDispatch } from '../store/hooks';

interface Prediction {
  label: string;
  category: string;
  confidence: number;
  points: number;
}

export default function ScanScreen() {
  const cameraRef = useRef<CameraView>(null);
  const dispatch = useAppDispatch();
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);

  const takePhoto = async () => {
    if (!cameraRef.current || loading || !cameraActive) return;

    try {
      setPrediction(null);
      setScanError(null);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        skipProcessing: true,
      });

      if (photo?.uri) {
        setPhotoUri(photo.uri);
        await uploadPhoto(photo.uri);
      }
    } catch (error) {
      setScanError('Tidak dapat mengambil foto sampah.');
      Alert.alert('Gagal', 'Tidak dapat mengambil foto sampah.');
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setLoading(true);
      setScanError(null);
      const formData = new FormData();
      const fileName = `waste-${Date.now()}.jpg`;

      if (Platform.OS === 'web') {
        const imageResponse = await fetch(uri);
        const imageBlob = await imageResponse.blob();
        formData.append('image', imageBlob, fileName);
      } else {
        formData.append('image', {
          uri,
          name: fileName,
          type: 'image/jpeg',
        } as any);
      }

      const response = await fetch(`${API_URL}/predict-waste`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data.detail || data.error || 'Model belum bisa membaca gambar ini.';
        setScanError(message);
        Alert.alert('Prediksi gagal', message);
        return;
      }

      setPrediction(data.prediction);
      dispatch(addScanPoints(Number(data.prediction.points || 0)));
    } catch (error) {
      const message =
        Platform.OS === 'android'
          ? 'Koneksi gagal. Jika memakai HP fisik, ganti API_URL ke IP laptop. Jika emulator, pastikan backend berjalan.'
          : 'Koneksi gagal. Pastikan backend berjalan dan model sudah selesai training.';
      setScanError(message);
      Alert.alert('Koneksi gagal', message);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color="#10B981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="camera-off-outline" size={56} color="#10B981" />
          <Text style={styles.permissionTitle}>Izin Kamera Diperlukan</Text>
          <Text style={styles.permissionText}>
            Aktifkan kamera agar Echo Tech bisa mengambil foto sampah untuk diuji oleh model.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Aktifkan Kamera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Scan Sampah</Text>
          <Text style={styles.subtitle}>Ambil foto, lalu model akan menebak jenis sampah dan akurasinya.</Text>
        </View>

        <View style={styles.cameraWrapper}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.preview} />
          ) : !cameraActive ? (
            <View style={styles.cameraStopped}>
              <MaterialCommunityIcons name="camera-off-outline" size={44} color="#A7F3D0" />
              <Text style={styles.cameraStoppedTitle}>Kamera Dimatikan</Text>
              <Text style={styles.cameraStoppedText}>Nyalakan kamera untuk mulai scan sampah lagi.</Text>
            </View>
          ) : (
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          )}
        </View>

        {loading && (
          <View style={styles.statusCard}>
            <ActivityIndicator color="#10B981" />
            <Text style={styles.statusText}>Model sedang membaca foto sampah...</Text>
          </View>
        )}

        {scanError && !loading && (
          <View style={[styles.statusCard, styles.errorCard]}>
            <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{scanError}</Text>
          </View>
        )}

        {prediction && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="recycle" size={28} color="#10B981" />
              <View style={styles.resultText}>
                <Text style={styles.resultLabel}>{prediction.label}</Text>
                <Text style={styles.resultCategory}>{prediction.category}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{Math.round(prediction.confidence * 100)}%</Text>
                <Text style={styles.metricLabel}>Akurasi</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>+{prediction.points}</Text>
                <Text style={styles.metricLabel}>Eco Poin</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {photoUri && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setPhotoUri(null);
                setPrediction(null);
                setScanError(null);
                setCameraActive(true);
              }}
              disabled={loading}
            >
              <Ionicons name="refresh-outline" size={20} color="#10B981" />
              <Text style={styles.secondaryButtonText}>Foto Ulang</Text>
            </TouchableOpacity>
          )}

          {!photoUri && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                !cameraActive && styles.secondaryButtonActive,
              ]}
              onPress={() => setCameraActive((current) => !current)}
              disabled={loading}
            >
              <Ionicons
                name={cameraActive ? 'stop-circle-outline' : 'camera-outline'}
                size={20}
                color={cameraActive ? '#EF4444' : '#10B981'}
              />
              <Text style={[styles.secondaryButtonText, cameraActive && styles.stopButtonText]}>
                {cameraActive ? 'Stop Scan' : 'Nyalakan Kamera'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.scanButton, (!!photoUri || loading || !cameraActive) && styles.scanButtonDisabled]}
            onPress={takePhoto}
            disabled={loading || !!photoUri || !cameraActive}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Scan Sekarang</Text>
              </>
            )}
          </TouchableOpacity>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4FAF6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#133B1C',
    fontFamily: 'GeistSans-Bold',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    fontFamily: 'GeistSans-Regular',
  },
  cameraWrapper: {
    marginHorizontal: 20,
    height: 360,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#EAF2EC',
  },
  camera: {
    flex: 1,
  },
  cameraStopped: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#0F172A',
  },
  cameraStoppedTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'GeistSans-Bold',
  },
  cameraStoppedText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#CBD5E1',
    textAlign: 'center',
    fontFamily: 'GeistSans-Regular',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    color: '#047857',
    fontFamily: 'GeistSans-Medium',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
    fontFamily: 'GeistSans-Medium',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultText: {
    flex: 1,
    marginLeft: 12,
  },
  resultLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'capitalize',
    fontFamily: 'GeistSans-Bold',
  },
  resultCategory: {
    marginTop: 2,
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  metricRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#047857',
    fontFamily: 'GeistSans-ExtraBold',
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'GeistSans-Medium',
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  scanButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'GeistSans-Bold',
  },
  secondaryButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonActive: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'GeistSans-Bold',
  },
  stopButtonText: {
    color: '#EF4444',
  },
  permissionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  permissionTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: '800',
    color: '#133B1C',
    textAlign: 'center',
    fontFamily: 'GeistSans-Bold',
  },
  permissionText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    fontFamily: 'GeistSans-Regular',
  },
  primaryButton: {
    marginTop: 22,
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'GeistSans-Bold',
  },
});
