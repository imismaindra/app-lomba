import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const stats = {
    totalScan: 24,
    ecoPoints: 150,
    treesSaved: 2,
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: t('profile.editProfile'),
      subtitle: t('profile.editProfileSubtitle'),
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: t('profile.changePassword'),
      subtitle: t('profile.changePasswordSubtitle'),
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      icon: 'notifications-outline',
      title: t('profile.notifications'),
      subtitle: t('profile.notificationsSubtitle'),
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    {
      icon: 'language-outline',
      title: t('profile.language'),
      subtitle: t('profile.languageSubtitle'),
      onPress: () => navigation.navigate('LanguageSettings'),
    },
    {
      icon: 'help-circle-outline',
      title: t('profile.help'),
      subtitle: t('profile.helpSubtitle'),
      onPress: () => navigation.navigate('Help'),
    },
    {
      icon: 'information-circle-outline',
      title: t('profile.about'),
      subtitle: t('profile.aboutSubtitle'),
      onPress: () => navigation.navigate('AboutApp'),
    },
  ];

  const handleLogout = () => {
    console.log('Tombol ditekan, langsung logout');
    logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FAF6" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Header Title */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.username ? user.username[0].toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>
          <Text style={styles.username}>{user?.username || t('profile.defaultUser')}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, styles.scanIconBg]}>
              <Ionicons name="scan-outline" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>{stats.totalScan}</Text>
            <Text style={styles.statLabel}>{t('profile.totalScan')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, styles.leafIconBg]}>
              <Ionicons name="leaf-outline" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>{stats.ecoPoints}</Text>
            <Text style={styles.statLabel}>{t('profile.ecoPoints')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, styles.treeIconBg]}>
              <Ionicons name="rose-outline" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>{stats.treesSaved}</Text>
            <Text style={styles.statLabel}>{t('profile.tree')}</Text>
          </View>
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>{t('profile.accountSettings')}</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={22} color="#4CAF50" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Echo Tech v1.0.0</Text>
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
  scrollContainer: {
    paddingBottom: 110,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#133B1C',
    fontFamily: 'GeistSans-Bold',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1.5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E4E2C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'GeistSans-Bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  username: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1C',
    marginBottom: 4,
    fontFamily: 'GeistSans-Bold',
  },
  email: {
    fontSize: 13,
    color: '#757575',
    fontFamily: 'GeistSans-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1.5,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scanIconBg: {
    backgroundColor: 'rgba(76, 175, 80, 0.06)',
  },
  leafIconBg: {
    backgroundColor: 'rgba(76, 175, 80, 0.06)',
  },
  treeIconBg: {
    backgroundColor: 'rgba(76, 175, 80, 0.06)',
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
    marginTop: 2,
    fontFamily: 'GeistSans-Medium',
  },
  statDivider: {
    width: 1,
    height: 40,
    alignSelf: 'center',
    backgroundColor: '#EAF2EC',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1.5,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#757575',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    fontFamily: 'GeistSans-Bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIcon: {
    width: 32,
    alignItems: 'flex-start',
  },
  menuContent: {
    flex: 1,
    marginLeft: 4,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
    fontFamily: 'GeistSans-Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: 'GeistSans-Bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
    fontFamily: 'GeistSans-Regular',
  },
});
