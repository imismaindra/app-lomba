import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const handleClassificationPress = () => {
    navigation.navigate('Scan');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FAF6" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>EcoClassify</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Model siap!</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.leafButton} 
            activeOpacity={0.8}
            onPress={() => Alert.alert("EcoClassify", `Halo ${user?.username || 'Pengguna'}! Model klasifikasi sampah AI siap digunakan.`)}
          >
            <Ionicons name="leaf" size={22} color="#1E4E2C" />
          </TouchableOpacity>
        </View>

        {/* Main Card (Klasifikasi Sampah) */}
        <TouchableOpacity style={styles.mainCard} activeOpacity={0.9} onPress={handleClassificationPress}>
          <View style={styles.mainCardContent}>
            <View style={styles.mainCardLeft}>
              <Text style={styles.mainCardTitle}>Klasifikasi Sampah</Text>
              <Text style={styles.mainCardSubtitle}>
                Gunakan AI untuk mengenali jenis sampah secara otomatis
              </Text>
              <View style={styles.badgeContainer}>
                <Ionicons name="bulb-outline" size={13} color="#FFF" style={styles.badgeIcon} />
                <Text style={styles.badgeText}>Mendukung 11 jenis sampah</Text>
              </View>
            </View>
            <View style={styles.mainCardRight}>
              <View style={styles.cameraIconWrapper}>
                <Ionicons name="camera" size={30} color="#FFF" />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Category Cards (Organik & Anorganik Grid) */}
        <View style={styles.gridContainer}>
          {/* Organik Card */}
          <View style={styles.categoryCard}>
            <View style={[styles.iconCircle, styles.organikIconBg]}>
              <Ionicons name="leaf-outline" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.categoryTitle}>Organik</Text>
            <Text style={styles.categorySubtitle}>6 Jenis</Text>
          </View>

          {/* Anorganik Card */}
          <View style={styles.categoryCard}>
            <View style={[styles.iconCircle, styles.anorganikIconBg]}>
              <Ionicons name="trash-outline" size={20} color="#2196F3" />
            </View>
            <Text style={styles.categoryTitle}>Anorganik</Text>
            <Text style={styles.categorySubtitle}>5 Jenis</Text>
          </View>
        </View>

        {/* Supported Waste Types Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Jenis Sampah yang Didukung</Text>

          {/* Organik List */}
          <View style={styles.categoryHeaderRow}>
            <View style={[styles.indicatorBar, styles.organikBar]} />
            <Text style={[styles.categoryHeaderLabel, styles.organikText]}>Organik</Text>
          </View>
          <View style={styles.tagsContainer}>
            {['🍎 Buah', '🌸 Bunga', '🌿 Campuran', '🥩 Daging', '🍃 Daun', '🍴 Makanan'].map((tag, index) => (
              <View key={index} style={styles.tagWrapper}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Anorganik List */}
          <View style={[styles.categoryHeaderRow, styles.marginTop16]}>
            <View style={[styles.indicatorBar, styles.anorganikBar]} />
            <Text style={[styles.categoryHeaderLabel, styles.anorganikText]}>Anorganik</Text>
          </View>
          <View style={styles.tagsContainer}>
            {['📦 Kardus', '📄 Kertas', '🍼 Plastik', '🥛 Kaca', '🔋 Logam'].map((tag, index) => (
              <View key={index} style={styles.tagWrapper}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity style={styles.floatingButton} activeOpacity={0.85} onPress={handleClassificationPress}>
          <Ionicons name="camera" size={20} color="#FFF" style={styles.floatingButtonIcon} />
          <Text style={styles.floatingButtonText}>Klasifikasi Sekarang</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4FAF6',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#133B1C',
    fontFamily: 'GeistSans-Bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    fontFamily: 'GeistSans-SemiBold',
  },
  leafButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mainCard: {
    backgroundColor: '#1E4E2C',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#1E4E2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  mainCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainCardLeft: {
    flex: 0.75,
  },
  mainCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: 'GeistSans-Bold',
  },
  mainCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    fontFamily: 'GeistSans-Regular',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'GeistSans-Medium',
  },
  mainCardRight: {
    flex: 0.25,
    alignItems: 'flex-end',
  },
  cameraIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#2D6F41',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryCard: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1.5,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  organikIconBg: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  anorganikIconBg: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1C',
    marginBottom: 4,
    fontFamily: 'GeistSans-Bold',
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'GeistSans-Regular',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1C',
    marginBottom: 16,
    fontFamily: 'GeistSans-Bold',
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  marginTop16: {
    marginTop: 16,
  },
  indicatorBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  organikBar: {
    backgroundColor: '#4CAF50',
  },
  anorganikBar: {
    backgroundColor: '#2196F3',
  },
  categoryHeaderLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  organikText: {
    color: '#4CAF50',
  },
  anorganikText: {
    color: '#2196F3',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAF2EC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 0.5,
  },
  tagText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    fontFamily: 'GeistSans-Medium',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E4E2C',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#1E4E2C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingButtonIcon: {
    marginRight: 8,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
});
