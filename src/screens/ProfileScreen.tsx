import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchEcoPointData } from '../store/ecoPointSlice';

// Level badge color
const getLevelColor = (level: string) => {
  switch (level) {
    case 'Bronze':
      return '#CD7F32';
    case 'Silver':
      return '#A0A0A0';
    case 'Gold':
      return '#FFB300';
    case 'Platinum':
      return '#78909C';
    default:
      return '#4CAF50';
  }
};

// Unified Cross-Platform Progress Bar
const CustomProgressBar = ({ progress, color }: { progress: number; color: string }) => {
  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  );
};

interface ProfileScreenProps {
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function ProfileScreen({ showToast }: ProfileScreenProps) {
  const navigation = useNavigation<any>();
  const { user, logout, token } = useAuth();
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // Get live stats from Redux
  const { userPoints } = useAppSelector((state) => state.ecoPoint);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEcoPointData(token));
    }, [dispatch, token])
  );

  const progress = userPoints.totalPoints / userPoints.nextLevelPoints;
  const levelColor = getLevelColor(userPoints.level);

  // Grouped Menu Settings
  const accountMenuItems = [
    {
      icon: 'person-outline',
      iconBg: '#E3F2FD',
      iconColor: '#2196F3',
      title: t('profile.editProfile'),
      subtitle: t('profile.editProfileSubtitle'),
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'shield-checkmark-outline',
      iconBg: '#FFF3E0',
      iconColor: '#FF9800',
      title: t('profile.changePassword'),
      subtitle: t('profile.changePasswordSubtitle'),
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      icon: 'notifications-outline',
      iconBg: '#F3E5F5',
      iconColor: '#9C27B0',
      title: t('profile.notifications'),
      subtitle: t('profile.notificationsSubtitle'),
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    {
      icon: 'language-outline',
      iconBg: '#E8F5E9',
      iconColor: '#4CAF50',
      title: t('profile.language'),
      subtitle: t('profile.languageSubtitle'),
      onPress: () => navigation.navigate('LanguageSettings'),
    },
  ];

  const infoMenuItems = [
    {
      icon: 'help-circle-outline',
      iconBg: '#E0F7FA',
      iconColor: '#00ACC1',
      title: t('profile.help'),
      subtitle: t('profile.helpSubtitle'),
      onPress: () => navigation.navigate('Help'),
    },
    {
      icon: 'information-circle-outline',
      iconBg: '#ECEFF1',
      iconColor: '#607D8B',
      title: t('profile.about'),
      subtitle: t('profile.aboutSubtitle'),
      onPress: () => navigation.navigate('AboutApp'),
    },
  ];

  const performLogout = async () => {
    console.log('Logging out user...');
    setIsLogoutModalVisible(false);
    showToast?.('Logout berhasil. Sampai jumpa!', 'success');
    await logout();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
    }
  };

  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Integrated Forest Green Profile Header (Inside ScrollView) */}
        <View style={styles.headerPanel}>
          {/* Abstract background decorative shape */}
          <View style={styles.headerCircleDecorator} />
          
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          </View>
          
          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.username ? user.username[0].toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={styles.onlineBadge} />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{user?.username || t('profile.defaultUser')}</Text>
              <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
              
              <View style={[styles.membershipBadge, { backgroundColor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Ionicons name="medal" size={12} color={levelColor} style={{ marginRight: 4 }} />
                <Text style={[styles.membershipText, { color: '#FFFFFF' }]}>{userPoints.level} Member</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Papan Dampak Lingkungan (Eco Contribution Board - No more clipping issues!) */}
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>Kontribusi Hijau Anda</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(76, 175, 80, 0.08)' }]}>
                <Ionicons name="scan-outline" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.statNumber}>{userPoints.itemsRecycled}</Text>
              <Text style={styles.statLabel}>{t('profile.totalScan')}</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(255, 179, 0, 0.08)' }]}>
                <Ionicons name="leaf-outline" size={18} color="#FFB300" />
              </View>
              <Text style={styles.statNumber}>{userPoints.totalPoints}</Text>
              <Text style={styles.statLabel}>{t('profile.ecoPoints')}</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(33, 150, 243, 0.08)' }]}>
                <Ionicons name="cloud-outline" size={18} color="#2196F3" />
              </View>
              <Text style={styles.statNumber}>{userPoints.co2Saved} kg</Text>
              <Text style={styles.statLabel}>CO₂ Reduksi</Text>
            </View>
          </View>

          {/* Level Progress Bar inside Profile */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelLeft}>{userPoints.level}</Text>
              <Text style={styles.progressLabelRight}>
                {userPoints.totalPoints} / {userPoints.nextLevelPoints} Poin
              </Text>
            </View>
            <CustomProgressBar progress={Math.min(progress, 1)} color={levelColor} />
            <Text style={styles.progressSubtitle}>
              Tingkat berikutnya: {userPoints.nextLevelName} ({userPoints.nextLevelPoints - userPoints.totalPoints} poin lagi)
            </Text>
          </View>
        </View>

        {/* Group 1: Account Settings */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupHeader}>{t('profile.accountSettings')}</Text>
          <View style={styles.groupContent}>
            {accountMenuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.settingsRow,
                  index === accountMenuItems.length - 1 && styles.noBottomBorder
                ]} 
                onPress={item.onPress} 
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrapper, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Group 2: Help & Info */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupHeader}>Informasi & Bantuan</Text>
          <View style={styles.groupContent}>
            {infoMenuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.settingsRow,
                  index === infoMenuItems.length - 1 && styles.noBottomBorder
                ]} 
                onPress={item.onPress} 
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrapper, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Integrated Logout Item */}
        <View style={styles.settingsGroup}>
          <View style={styles.groupContent}>
            <TouchableOpacity 
              style={[styles.settingsRow, styles.noBottomBorder]} 
              onPress={handleLogout} 
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuItemTitle, { color: '#EF4444' }]}>{t('profile.logout')}</Text>
                <Text style={styles.menuItemSubtitle}>Keluar dari sesi akun Anda saat ini</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>Echo Tech v1.0.0</Text>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={isLogoutModalVisible}
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.logoutModal}>
            <View style={styles.logoutModalIcon}>
              <Ionicons name="log-out-outline" size={28} color="#EF4444" />
            </View>
            <Text style={styles.logoutModalTitle}>Keluar Akun?</Text>
            <Text style={styles.logoutModalText}>
              Anda akan keluar dari sesi akun saat ini dan kembali ke halaman awal.
            </Text>

            <View style={styles.logoutModalActions}>
              <TouchableOpacity
                style={styles.cancelLogoutButton}
                onPress={() => setIsLogoutModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelLogoutText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmLogoutButton}
                onPress={performLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmLogoutText}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E4E2C', // Green safe area top to match header
  },
  container: {
    flex: 1,
    backgroundColor: '#F4FAF6', // Rest of screen has the soft green background
  },
  scrollContainer: {
    paddingBottom: 140, // Expanded padding to clear FloatingTabBar completely
  },
  headerPanel: {
    backgroundColor: '#1E4E2C',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 32, // Accommodate status bar
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  headerCircleDecorator: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'GeistSans-Bold',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E4E2C',
    fontFamily: 'GeistSans-Bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2.5,
    borderColor: '#1E4E2C',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'GeistSans-Bold',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: 'GeistSans-Regular',
    marginBottom: 8,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  membershipText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'GeistSans-Bold',
  },
  impactCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -24, // Sits overlapping green header curve perfectly
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    shadowColor: '#1E4E2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#133B1C',
    textTransform: 'uppercase',
    marginBottom: 16,
    fontFamily: 'GeistSans-Bold',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#757575',
    fontFamily: 'GeistSans-Medium',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F1F5F9',
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabelLeft: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4E2C',
    fontFamily: 'GeistSans-Bold',
  },
  progressLabelRight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757575',
    fontFamily: 'GeistSans-Bold',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'GeistSans-Regular',
    marginTop: 6,
  },
  settingsGroup: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
    fontFamily: 'GeistSans-Bold',
    letterSpacing: 0.5,
  },
  groupContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  noBottomBorder: {
    borderBottomWidth: 0,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: '#757575',
    fontFamily: 'GeistSans-Regular',
    marginTop: 2,
  },
  versionText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 20,
    fontFamily: 'GeistSans-Regular',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoutModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  logoutModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: 'GeistSans-Bold',
  },
  logoutModalText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'GeistSans-Regular',
  },
  logoutModalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 20,
  },
  cancelLogoutButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLogoutText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'GeistSans-Bold',
  },
  confirmLogoutButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLogoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'GeistSans-Bold',
  },
});
