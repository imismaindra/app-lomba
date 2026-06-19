import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal,
  LayoutAnimation,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchEcoPointData, finishRedeem, Reward, startRedeem, redeemReward } from '../store/ecoPointSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useAuth } from '../context/AuthContext';

// Enable LayoutAnimation for Android (only if not running on New Architecture / Fabric)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  if (!(global as any).nativeFabricUIScheduler) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

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

// Categorize rewards (Digital vs Fisik)
const getRewardCategory = (rewardId: number) => {
  if (rewardId === 3 || rewardId === 4) {
    return 'Fisik';
  }
  return 'Digital';
};

// Unified Cross-Platform Progress Bar
const CustomProgressBar = ({ progress, color }: { progress: number; color: string }) => {
  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  );
};

// Reward Card Component
const RewardCard = ({
  reward,
  userPoints,
  isRedeeming,
  onPress,
}: {
  reward: Reward;
  userPoints: number;
  isRedeeming: boolean;
  onPress: () => void;
}) => {
  const isLocked = userPoints < reward.points;
  const isAvailable = reward.available;
  const pointsNeeded = reward.points - userPoints;

  return (
    <TouchableOpacity
      style={[
        styles.rewardCard, 
        (!isAvailable || isLocked) && styles.rewardCardDisabled,
        isRedeeming && styles.rewardCardRedeeming
      ]}
      onPress={onPress}
      disabled={!isAvailable || isLocked || isRedeeming}
      activeOpacity={0.7}
    >
      <View style={[
        styles.rewardIconContainer, 
        isAvailable && !isLocked ? styles.rewardIconActive : styles.rewardIconDisabled
      ]}>
        <Ionicons 
          name={reward.icon as any} 
          size={26} 
          color={isAvailable && !isLocked ? '#4CAF50' : '#94A3B8'} 
        />
      </View>
      
      <View style={styles.rewardContent}>
        <Text style={[styles.rewardName, (!isAvailable || isLocked) && styles.rewardNameDisabled]}>
          {reward.name}
        </Text>
        <Text style={[styles.rewardDescription, (!isAvailable || isLocked) && styles.rewardDescriptionDisabled]}>
          {reward.description}
        </Text>
        
        {/* Status badges underneath description */}
        <View style={styles.badgeRow}>
          {!isAvailable ? (
            <View style={[styles.statusBadge, styles.badgeUnavailable]}>
              <Ionicons name="close-circle-outline" size={12} color="#EF4444" />
              <Text style={[styles.statusBadgeText, styles.textUnavailable]}>Stok Habis</Text>
            </View>
          ) : isLocked ? (
            <View style={[styles.statusBadge, styles.badgeLocked]}>
              <Ionicons name="lock-closed-outline" size={12} color="#F59E0B" />
              <Text style={[styles.statusBadgeText, styles.textLocked]}>Butuh {pointsNeeded} Poin lagi</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.badgeAvailable]}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#4CAF50" />
              <Text style={[styles.statusBadgeText, styles.textAvailable]}>Bisa Ditukar</Text>
            </View>
          )}
        </View>
      </View>

      {isRedeeming ? (
        <ActivityIndicator color="#4CAF50" />
      ) : (
        <View style={[
          styles.rewardPointsContainer, 
          isAvailable && !isLocked ? styles.rewardPointsActive : styles.rewardPointsDisabled
        ]}>
          <Text style={[
            styles.rewardPoints, 
            (!isAvailable || isLocked) && styles.rewardPointsTextDisabled
          ]}>
            {reward.points}
          </Text>
          <Ionicons 
            name="leaf-outline" 
            size={13} 
            color={isAvailable && !isLocked ? '#4CAF50' : '#94A3B8'} 
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function EcoPointScreen() {
  const dispatch = useAppDispatch();
  const { token } = useAuth();
  const { userPoints, rewards, redeemingId, loading, error } = useAppSelector((state) => state.ecoPoint);
  const navigation = useNavigation<any>();

  // Filter and Modal States
  const [activeRewardFilter, setActiveRewardFilter] = useState('Semua');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [redeemStep, setRedeemStep] = useState<'confirm' | 'processing' | 'success'>('confirm');

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEcoPointData(token));
    }, [dispatch, token])
  );

  const progress = userPoints.totalPoints / userPoints.nextLevelPoints;
  const levelColor = getLevelColor(userPoints.level);
  const levelIcon = getLevelIcon(userPoints.level);

  // Filter rewards list
  const filteredRewards = rewards.filter((reward) => {
    const category = getRewardCategory(reward.id);
    if (activeRewardFilter === 'Semua') return true;
    return category === activeRewardFilter;
  });

  const handleRedeemPress = (reward: Reward) => {
    setSelectedReward(reward);
    setRedeemStep('confirm');
    setShowConfirmModal(true);
  };

  const handleRedeemConfirm = async () => {
    if (!selectedReward) return;
    setRedeemStep('processing');
    try {
      const resultAction = await dispatch(redeemReward({ token, rewardId: selectedReward.id }));
      if (redeemReward.fulfilled.match(resultAction)) {
        setRedeemStep('success');
      } else {
        setRedeemStep('confirm');
        Alert.alert('Gagal Menukar', (resultAction.payload as string) || 'Terjadi kesalahan saat memproses penukaran poin.');
      }
    } catch (err) {
      setRedeemStep('confirm');
      Alert.alert('Kesalahan', 'Terjadi kesalahan koneksi saat memproses penukaran poin.');
    }
  };

  const closeRedeemModal = () => {
    setShowConfirmModal(false);
    setSelectedReward(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FAF6" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {loading && !showConfirmModal && (
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
          <TouchableOpacity 
            style={styles.leaderboardButton} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Ionicons name="trophy-outline" size={18} color="#1E4E2C" />
            <Text style={styles.leaderboardButtonText}>Peringkat</Text>
          </TouchableOpacity>
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

          {/* Horizontal Filter Pills */}
          <View style={styles.rewardFilterWrapper}>
            {['Semua', 'Digital', 'Fisik'].map((filter) => {
              const isActive = activeRewardFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.rewardFilterPill,
                    isActive ? styles.rewardFilterPillActive : styles.rewardFilterPillInactive
                  ]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setActiveRewardFilter(filter);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.rewardFilterPillText, 
                    isActive ? styles.rewardFilterPillTextActive : styles.rewardFilterPillTextInactive
                  ]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filteredRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              userPoints={userPoints.totalPoints}
              isRedeeming={redeemingId === reward.id}
              onPress={() => handleRedeemPress(reward)}
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

      {/* Redeem Confirmation & Success Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeRedeemModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={redeemStep === 'confirm' ? closeRedeemModal : undefined}
          />
          
          <View style={styles.modalContent}>
            {/* Drag indicator bar */}
            <View style={styles.modalDragIndicator} />

            {redeemStep === 'confirm' && selectedReward && (
              <View style={styles.modalStepContainer}>
                <Text style={styles.modalTitle}>Konfirmasi Penukaran</Text>
                <Text style={styles.modalSubtitle}>Apakah Anda yakin ingin menukarkan poin untuk reward ini?</Text>

                {/* Reward Card Preview */}
                <View style={styles.previewCard}>
                  <View style={[styles.previewIconWrapper, { backgroundColor: 'rgba(76, 175, 80, 0.08)' }]}>
                    <Ionicons name={selectedReward.icon as any} size={32} color="#4CAF50" />
                  </View>
                  <Text style={styles.previewName}>{selectedReward.name}</Text>
                  <Text style={styles.previewDescription}>{selectedReward.description}</Text>
                  
                  <View style={styles.previewPointsRow}>
                    <Text style={styles.previewPointsValue}>{selectedReward.points}</Text>
                    <Text style={styles.previewPointsLabel}>Eco Poin</Text>
                  </View>
                </View>

                {/* Balance summary */}
                <View style={styles.balanceSummary}>
                  <View style={styles.balanceRowItem}>
                    <Text style={styles.balanceLabel}>Eco Poin Anda</Text>
                    <Text style={styles.balanceValue}>{userPoints.totalPoints} Poin</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.balanceRowItem}>
                    <Text style={styles.balanceLabel}>Sisa Poin Setelah Tukar</Text>
                    <Text style={[styles.balanceValue, { color: '#4CAF50', fontWeight: '800' }]}>
                      {userPoints.totalPoints - selectedReward.points} Poin
                    </Text>
                  </View>
                </View>

                {/* Modal Buttons */}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity 
                    style={styles.btnCancel} 
                    onPress={closeRedeemModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.btnCancelText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnConfirm} 
                    onPress={handleRedeemConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnConfirmText}>Tukarkan Poin</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {redeemStep === 'processing' && (
              <View style={styles.modalStepContainerCenter}>
                <ActivityIndicator size="large" color="#1E4E2C" />
                <Text style={styles.modalTitleCenter}>Memproses Penukaran...</Text>
                <Text style={styles.modalSubtitleCenter}>Harap tunggu sebentar, sistem sedang memverifikasi poin Anda.</Text>
              </View>
            )}

            {redeemStep === 'success' && selectedReward && (
              <View style={styles.modalStepContainerCenter}>
                <View style={styles.successIconWrapper}>
                  <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
                </View>
                <Text style={styles.modalTitleCenter}>Penukaran Berhasil!</Text>
                <Text style={styles.modalSubtitleCenter}>
                  Selamat! Anda berhasil menukarkan {selectedReward.points} Eco Poin untuk {selectedReward.name}.
                </Text>
                
                <TouchableOpacity 
                  style={styles.btnSuccessClose} 
                  onPress={closeRedeemModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnSuccessCloseText}>Selesai & Tutup</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leaderboardButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E4E2C',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#1E4E2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
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
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
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
    opacity: 0.65,
  },
  rewardCardRedeeming: {
    borderColor: '#4CAF50',
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
    color: '#64748B',
  },
  rewardDescription: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
    fontFamily: 'GeistSans-Regular',
  },
  rewardDescriptionDisabled: {
    color: '#94A3B8',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeAvailable: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  badgeLocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  badgeUnavailable: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  textAvailable: {
    color: '#4CAF50',
  },
  textLocked: {
    color: '#D97706',
  },
  textUnavailable: {
    color: '#EF4444',
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
  rewardFilterWrapper: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  rewardFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  rewardFilterPillActive: {
    backgroundColor: '#1E4E2C',
    borderColor: '#1E4E2C',
  },
  rewardFilterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EAF2EC',
  },
  rewardFilterPillText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  rewardFilterPillTextActive: {
    color: '#FFFFFF',
  },
  rewardFilterPillTextInactive: {
    color: '#64748B',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalDragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalStepContainer: {
    width: '100%',
  },
  modalStepContainerCenter: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#757575',
    fontFamily: 'GeistSans-Regular',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalTitleCenter: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
    marginTop: 16,
    marginBottom: 6,
  },
  modalSubtitleCenter: {
    fontSize: 13,
    color: '#757575',
    fontFamily: 'GeistSans-Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    lineHeight: 18,
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
    marginBottom: 2,
  },
  previewDescription: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'GeistSans-Regular',
    marginBottom: 12,
  },
  previewPointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  previewPointsValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4CAF50',
    fontFamily: 'GeistSans-ExtraBold',
  },
  previewPointsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
    fontFamily: 'GeistSans-Bold',
  },
  balanceSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    padding: 14,
    marginBottom: 24,
  },
  balanceRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#757575',
    fontFamily: 'GeistSans-Medium',
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#EAF2EC',
    marginVertical: 8,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: '#1E4E2C',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76,175,80,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnSuccessClose: {
    backgroundColor: '#1E4E2C',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnSuccessCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
});
