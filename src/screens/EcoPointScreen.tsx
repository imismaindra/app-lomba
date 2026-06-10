import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ProgressBarAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchEcoPointData, finishRedeem, Reward, startRedeem } from '../store/ecoPointSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useAuth } from '../context/AuthContext';

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

// Level icon
const getLevelIcon = (level: string) => {
  switch (level) {
    case 'Bronze':
      return 'medal-outline';
    case 'Silver':
      return 'medal-outline';
    case 'Gold':
      return 'medal-outline';
    default:
      return 'star-outline';
  }
};

// Progress bar component
const CustomProgressBar = ({ progress, color }: { progress: number; color: string }) => {
  if (Platform.OS === 'android') {
    return (
      <ProgressBarAndroid
        styleAttr="Horizontal"
        indeterminate={false}
        progress={progress}
        color={color}
      />
    );
  }
  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  );
};

// Reward Card Component
const RewardCard = ({
  reward,
  isRedeeming,
  onPress,
}: {
  reward: Reward;
  isRedeeming: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.rewardCard, !reward.available && styles.rewardCardDisabled]}
    onPress={onPress}
    disabled={!reward.available || isRedeeming}
    activeOpacity={0.7}
  >
    <View style={[styles.rewardIconContainer, reward.available ? styles.rewardIconActive : styles.rewardIconDisabled]}>
      <Ionicons name={reward.icon as any} size={26} color={reward.available ? '#4CAF50' : '#94A3B8'} />
    </View>
    <View style={styles.rewardContent}>
      <Text style={[styles.rewardName, !reward.available && styles.rewardNameDisabled]}>{reward.name}</Text>
      <Text style={[styles.rewardDescription, !reward.available && styles.rewardDescriptionDisabled]}>{reward.description}</Text>
    </View>
    {isRedeeming ? (
      <ActivityIndicator color="#4CAF50" />
    ) : (
      <View style={[styles.rewardPointsContainer, reward.available ? styles.rewardPointsActive : styles.rewardPointsDisabled]}>
        <Text style={[styles.rewardPoints, !reward.available && styles.rewardPointsTextDisabled]}>{reward.points}</Text>
        <Ionicons name="leaf-outline" size={13} color={reward.available ? '#4CAF50' : '#94A3B8'} />
      </View>
    )}
  </TouchableOpacity>
);

export default function EcoPointScreen() {
  const dispatch = useAppDispatch();
  const { token } = useAuth();
  const { userPoints, rewards, redeemingId, loading, error } = useAppSelector((state) => state.ecoPoint);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEcoPointData(token));
    }, [dispatch, token])
  );

  const progress = userPoints.totalPoints / userPoints.nextLevelPoints;
  const levelColor = getLevelColor(userPoints.level);
  const levelIcon = getLevelIcon(userPoints.level);

  const handleRedeem = (rewardId: number, points: number) => {
    if (userPoints.totalPoints >= points) {
      dispatch(startRedeem(rewardId));
      setTimeout(() => {
        dispatch(finishRedeem(points));
        alert('Selamat! Reward berhasil ditukarkan.');
      }, 1000);
    } else {
      alert(`Poin tidak cukup. Butuh ${points - userPoints.totalPoints} poin lagi.`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FAF6" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {loading && (
          <View style={styles.asyncStatus}>
            <ActivityIndicator color="#1E4E2C" size="small" />
            <Text style={styles.asyncStatusText}>Memuat data Eco Poin...</Text>
          </View>
        )}

        {error && (
          <View style={[styles.asyncStatus, styles.asyncError]}>
            <Ionicons name="alert-circle-outline" size={18} color="#F44336" />
            <Text style={[styles.asyncStatusText, styles.asyncErrorText]}>{error}</Text>
          </View>
        )}

        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Eco Poin</Text>
        </View>

        {/* Header dengan poin utama */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Ionicons name="leaf-outline" size={28} color="#FFFFFF" />
            <Text style={styles.pointsTitle}>Eco Poin Saya</Text>
          </View>
          <Text style={styles.pointsValue}>{userPoints.totalPoints}</Text>
          <Text style={styles.pointsSubtitle}>Total poin yang terkumpul</Text>

          {/* Level Progress */}
          <View style={styles.levelContainer}>
            <View style={styles.levelBadge}>
              <Ionicons name={levelIcon as any} size={18} color={levelColor} />
              <Text style={[styles.levelText, { color: levelColor }]}>{userPoints.level}</Text>
            </View>
            <View style={styles.progressWrapper}>
              <CustomProgressBar progress={Math.min(progress, 1)} color={levelColor} />
              <Text style={styles.progressText}>
                {userPoints.totalPoints} / {userPoints.nextLevelPoints} poin menuju {userPoints.nextLevelName}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistik Dampak */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Dampak Lingkungan</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="cloud-outline" size={26} color="#2196F3" />
              <Text style={styles.statValue}>{userPoints.co2Saved} kg</Text>
              <Text style={styles.statLabel}>CO₂ Dicegah</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="leaf-outline" size={26} color="#4CAF50" />
              <Text style={styles.statValue}>{userPoints.itemsRecycled}</Text>
              <Text style={styles.statLabel}>Didaur Ulang</Text>
            </View>
          </View>
        </View>

        {/* Cara Mendapatkan Poin */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Cara Mendapatkan Poin</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipIcon}>
                <Ionicons name="scan-outline" size={20} color="#4CAF50" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Scan Sampah</Text>
                <Text style={styles.tipDesc}>Sampah organik +5 poin, anorganik +10 poin, B3 +25 poin</Text>
              </View>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipIcon}>
                <Ionicons name="share-social-outline" size={20} color="#4CAF50" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Bagikan ke Teman</Text>
                <Text style={styles.tipDesc}>Ajak teman bergabung dapat +50 poin</Text>
              </View>
            </View>
            <View style={[styles.tipItem, styles.noBorder]}>
              <View style={styles.tipIcon}>
                <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Challenge Harian</Text>
                <Text style={styles.tipDesc}>Selesaikan misi harian dapat +20 poin</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tukar Poin */}
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>Tukar Poin</Text>
          <Text style={styles.rewardsSubtitle}>
            Tukarkan poinmu dengan reward menarik!
          </Text>
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              isRedeeming={redeemingId === reward.id}
              onPress={() => handleRedeem(reward.id, reward.points)}
            />
          ))}
        </View>

        {/* Tips Tambahan */}
        <View style={styles.footerTip}>
          <Ionicons name="bulb-outline" size={20} color="#1E4E2C" />
          <Text style={styles.footerTipText}>
            Scan lebih banyak sampah untuk mengumpulkan poin dan naik level!
          </Text>
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
  scrollContainer: {
    paddingBottom: 110,
  },
  header: {
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
  asyncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    gap: 10,
  },
  asyncStatusText: {
    flex: 1,
    color: '#1E4E2C',
    fontSize: 13,
    fontFamily: 'GeistSans-Medium',
  },
  asyncError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  asyncErrorText: {
    color: '#F44336',
  },
  pointsCard: {
    backgroundColor: '#1E4E2C',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    padding: 22,
    borderRadius: 24,
    shadowColor: '#1E4E2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    fontFamily: 'GeistSans-SemiBold',
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'GeistSans-ExtraBold',
  },
  pointsSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    fontFamily: 'GeistSans-Regular',
  },
  levelContainer: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 12,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    fontFamily: 'GeistSans-Bold',
  },
  progressWrapper: {
    gap: 6,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'GeistSans-Regular',
  },
  statsSection: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1C',
    marginBottom: 12,
    fontFamily: 'GeistSans-Bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1C',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'GeistSans-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'GeistSans-Medium',
  },
  tipsSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  tipsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EAF2EC',
  },
  tipItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1C',
    marginBottom: 2,
    fontFamily: 'GeistSans-Bold',
  },
  tipDesc: {
    fontSize: 13,
    color: '#757575',
    lineHeight: 18,
    fontFamily: 'GeistSans-Regular',
  },
  rewardsSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  rewardsSubtitle: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 12,
    fontFamily: 'GeistSans-Regular',
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  rewardCardDisabled: {
    opacity: 0.5,
  },
  rewardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rewardIconActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  rewardIconDisabled: {
    backgroundColor: '#F5F5F5',
  },
  rewardContent: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
  },
  rewardNameDisabled: {
    color: '#94A3B8',
  },
  rewardDescription: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
    fontFamily: 'GeistSans-Regular',
  },
  rewardDescriptionDisabled: {
    color: '#CBD5E1',
  },
  rewardPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rewardPointsActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  rewardPointsDisabled: {
    backgroundColor: '#F5F5F5',
  },
  rewardPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
    fontFamily: 'GeistSans-Bold',
  },
  rewardPointsTextDisabled: {
    color: '#94A3B8',
  },
  footerTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    gap: 10,
  },
  footerTipText: {
    flex: 1,
    fontSize: 13,
    color: '#1E4E2C',
    fontFamily: 'GeistSans-Regular',
  },
});
