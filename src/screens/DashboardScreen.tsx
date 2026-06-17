import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchEcoPointData } from '../store/ecoPointSlice';

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  // Get user statistics from Redux
  const { userPoints } = useAppSelector((state) => state.ecoPoint);

  // Active guide tab state
  const [activeGuideTab, setActiveGuideTab] = useState<'organik' | 'anorganik'>('organik');

  // Pulsating animation for AI detector status
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Refresh statistics on focus
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEcoPointData(token));
    }, [dispatch, token])
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 11) return 'Selamat Pagi';
    if (hours < 15) return 'Selamat Siang';
    if (hours < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const handleClassificationPress = () => {
    navigation.navigate('Scan');
  };

  const organicItems = [
    { emoji: '🍎', name: 'Buah' },
    { emoji: '🌸', name: 'Bunga' },
    { emoji: '🌿', name: 'Campuran' },
    { emoji: '🥩', name: 'Daging' },
    { emoji: '🍃', name: 'Daun' },
    { emoji: '🍴', name: 'Makanan' }
  ];

  const inorganicItems = [
    { emoji: '📦', name: 'Kardus' },
    { emoji: '📄', name: 'Kertas' },
    { emoji: '🍼', name: 'Plastik' },
    { emoji: '🥛', name: 'Kaca' },
    { emoji: '🔋', name: 'Logam' }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FAF6" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header: Greeting & Profile Avatar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.usernameText}>{user?.username || 'Eco User'}</Text>
          </View>
          
          <View style={styles.headerRight}>
            {/* AI Status Badge */}
            <View style={styles.statusBadge}>
              <Animated.View style={[styles.statusDot, { opacity: pulseAnim }]} />
              <Text style={styles.statusText}>AI Detektor Aktif</Text>
            </View>
            
            {/* Avatar Circle */}
            <TouchableOpacity 
              style={styles.avatarButton} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profil')}
            >
              <Text style={styles.avatarText}>{getInitials(user?.username)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Statistics Bar */}
        <View style={styles.statsBar}>
          {/* Points */}
          <TouchableOpacity 
            style={styles.statBox} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Eco Poin')}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(76, 175, 80, 0.08)' }]}>
              <Ionicons name="leaf-outline" size={18} color="#4CAF50" />
            </View>
            <Text style={styles.statVal}>{userPoints.totalPoints}</Text>
            <Text style={styles.statLbl}>Poin Saya</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          {/* Level */}
          <TouchableOpacity 
            style={styles.statBox} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Eco Poin')}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(255, 179, 0, 0.08)' }]}>
              <Ionicons name="medal-outline" size={18} color="#FFB300" />
            </View>
            <Text style={styles.statVal}>{userPoints.level}</Text>
            <Text style={styles.statLbl}>Peringkat</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          {/* CO2 Saved */}
          <TouchableOpacity 
            style={styles.statBox} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Eco Poin')}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(33, 150, 243, 0.08)' }]}>
              <Ionicons name="cloud-outline" size={18} color="#2196F3" />
            </View>
            <Text style={styles.statVal}>{userPoints.co2Saved} kg</Text>
            <Text style={styles.statLbl}>CO₂ Reduksi</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Banner Card */}
        <TouchableOpacity style={styles.heroCard} activeOpacity={0.9} onPress={handleClassificationPress}>
          <View style={styles.heroCardContent}>
            <View style={styles.heroCardLeft}>
              <Text style={styles.heroCardTitle}>Kenali Sampahmu</Text>
              <Text style={styles.heroCardSubtitle}>
                Arahkan kamera ke sampah untuk membedakan kategori Organik & Anorganik dalam hitungan detik.
              </Text>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.heroBadgeText}>Ditenagai CNN Model</Text>
              </View>
            </View>
            <View style={styles.heroCardRight}>
              <View style={styles.heroIconCircle}>
                <Ionicons name="camera-outline" size={32} color="#1E4E2C" />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Feature Quick Actions Grid (2x2) */}
        <Text style={styles.sectionTitle}>Menu Utama</Text>
        <View style={styles.gridContainer}>
          {/* Action: Scanner */}
          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.8} 
            onPress={() => navigation.navigate('Scan')}
          >
            <View style={[styles.gridIconWrapper, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
              <Ionicons name="qr-code-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.gridCardTitle}>Pindai AI</Text>
            <Text style={styles.gridCardDesc}>Scan & raih poin</Text>
          </TouchableOpacity>

          {/* Action: Maps */}
          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.8} 
            onPress={() => navigation.navigate('Map')}
          >
            <View style={[styles.gridIconWrapper, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
              <Ionicons name="map-outline" size={24} color="#2196F3" />
            </View>
            <Text style={styles.gridCardTitle}>Bank Sampah</Text>
            <Text style={styles.gridCardDesc}>Cari lokasi terdekat</Text>
          </TouchableOpacity>

          {/* Action: Leaderboard */}
          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.8} 
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <View style={[styles.gridIconWrapper, { backgroundColor: 'rgba(255, 179, 0, 0.1)' }]}>
              <Ionicons name="trophy-outline" size={24} color="#FFB300" />
            </View>
            <Text style={styles.gridCardTitle}>Peringkat</Text>
            <Text style={styles.gridCardDesc}>10 besar global</Text>
          </TouchableOpacity>

          {/* Action: Rewards */}
          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.8} 
            onPress={() => navigation.navigate('Eco Poin')}
          >
            <View style={[styles.gridIconWrapper, { backgroundColor: 'rgba(156, 39, 176, 0.1)' }]}>
              <Ionicons name="gift-outline" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.gridCardTitle}>Tukar Poin</Text>
            <Text style={styles.gridCardDesc}>Klaim voucher & bibit</Text>
          </TouchableOpacity>
        </View>

        {/* Supported Waste Guide Section (Interactive Tabs) */}
        <View style={styles.guideContainer}>
          <Text style={styles.sectionTitle}>Panduan Jenis Sampah</Text>
          <Text style={styles.guideSubtitle}>Ketahui jenis sampah yang dapat dideteksi oleh AI</Text>
          
          {/* Tab Switcher */}
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tabButton, activeGuideTab === 'organik' && styles.tabButtonActiveOrganic]}
              onPress={() => setActiveGuideTab('organik')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="leaf-outline" 
                size={16} 
                color={activeGuideTab === 'organik' ? '#FFFFFF' : '#757575'} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabText, activeGuideTab === 'organik' && styles.tabTextActive]}>Organik</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeGuideTab === 'anorganik' && styles.tabButtonActiveInorganic]}
              onPress={() => setActiveGuideTab('anorganik')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="trash-outline" 
                size={16} 
                color={activeGuideTab === 'anorganik' ? '#FFFFFF' : '#757575'} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabText, activeGuideTab === 'anorganik' && styles.tabTextActive]}>Anorganik</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContentContainer}>
            {activeGuideTab === 'organik' ? (
              <View>
                <Text style={styles.tabContentDesc}>
                  Sampah yang berasal dari sisa makhluk hidup dan mudah membusuk secara alami.
                  <Text style={{ fontWeight: '700', color: '#4CAF50' }}> Reward: +5 Eco Poin per scan.</Text>
                </Text>
                <View style={styles.tagsContainer}>
                  {organicItems.map((item, index) => (
                    <View key={index} style={[styles.tagWrapper, styles.organicTag]}>
                      <Text style={styles.tagText}>{item.emoji} {item.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.tabContentDesc}>
                  Limbah buatan manusia yang tidak mudah hancur alami dan membutuhkan daur ulang industri.
                  <Text style={{ fontWeight: '700', color: '#2196F3' }}> Reward: +10 Eco Poin per scan.</Text>
                </Text>
                <View style={styles.tagsContainer}>
                  {inorganicItems.map((item, index) => (
                    <View key={index} style={[styles.tagWrapper, styles.inorganicTag]}>
                      <Text style={styles.tagText}>{item.emoji} {item.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4FAF6', // Soft eco green background
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110, // Generous padding to clear the floating tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  headerLeft: {
    flex: 0.6,
  },
  greetingText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'GeistSans-Regular',
  },
  usernameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#133B1C',
    fontFamily: 'GeistSans-Bold',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E4E2C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E4E2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'GeistSans-Bold',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1.5,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
  },
  statLbl: {
    fontSize: 11,
    color: '#757575',
    fontFamily: 'GeistSans-Medium',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: '#1E4E2C', // Deep forest green
    borderRadius: 24,
    padding: 22,
    marginBottom: 26,
    shadowColor: '#1E4E2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  heroCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCardLeft: {
    flex: 0.72,
  },
  heroCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    fontFamily: 'GeistSans-Bold',
  },
  heroCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
    fontFamily: 'GeistSans-Regular',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  heroCardRight: {
    flex: 0.28,
    alignItems: 'flex-end',
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F4FAF6', // Crisp light background contrast
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#133B1C',
    fontFamily: 'GeistSans-Bold',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 26,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  gridIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
    marginBottom: 2,
  },
  gridCardDesc: {
    fontSize: 11,
    color: '#757575',
    fontFamily: 'GeistSans-Regular',
  },
  guideContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 10,
  },
  guideSubtitle: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'GeistSans-Regular',
    marginTop: -8,
    marginBottom: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActiveOrganic: {
    backgroundColor: '#4CAF50',
  },
  tabButtonActiveInorganic: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: 'GeistSans-Bold',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContentContainer: {
    minHeight: 130,
  },
  tabContentDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    fontFamily: 'GeistSans-Regular',
    marginBottom: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagWrapper: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  organicTag: {
    backgroundColor: 'rgba(76, 175, 80, 0.06)',
    borderColor: 'rgba(76, 175, 80, 0.15)',
  },
  inorganicTag: {
    backgroundColor: 'rgba(33, 150, 243, 0.06)',
    borderColor: 'rgba(33, 150, 243, 0.15)',
  },
  tagText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
    fontFamily: 'GeistSans-SemiBold',
  },
});
