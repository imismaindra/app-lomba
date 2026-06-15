import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../../config';

interface LeaderboardItem {
  rank: number;
  userId: number;
  username: string;
  totalPoints: number;
  scanCount: number;
}

export default function LeaderboardScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/leaderboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setLeaderboard(data.leaderboard);
        setCurrentUserRank(data.currentUserRank);
      } else {
        setError(data.error || 'Gagal memuat papan peringkat');
      }
    } catch (err) {
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#F1F5F9';
    }
  };

  const getRankBadgeTextColor = (rank: number) => {
    return rank <= 3 ? '#1E293B' : '#64748B';
  };

  // Split top 3 and others
  const topThree = leaderboard.slice(0, 3);
  // Reorder top 3 for podium: [2, 1, 3] if available
  const podiumItems = [];
  
  // Custom podium mapping to show 2nd on left, 1st in center, 3rd on right
  if (topThree.length > 0) {
    if (topThree[1]) podiumItems.push(topThree[1]); // 2nd
    if (topThree[0]) podiumItems.push(topThree[0]); // 1st
    if (topThree[2]) podiumItems.push(topThree[2]); // 3rd
  }

  const restOfList = leaderboard.slice(3);

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
        <Text style={styles.headerTitle}>Papan Peringkat</Text>
        <View style={styles.placeholder} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Memuat peringkat global...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLeaderboard}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
          }
        >
          {/* Top 3 Podium */}
          {podiumItems.length > 0 && (
            <View style={styles.podiumContainer}>
              {podiumItems.map((item) => {
                const isWinner = item.rank === 1;
                const podiumHeight = isWinner ? 110 : item.rank === 2 ? 90 : 70;
                const medalIcon = isWinner ? '🥇' : item.rank === 2 ? '🥈' : '🥉';
                
                return (
                  <View key={item.userId} style={[styles.podiumCol, isWinner && styles.podiumWinnerCol]}>
                    <View style={styles.avatarContainer}>
                      <View style={[styles.avatarCircle, { borderColor: getRankBadgeColor(item.rank) }]}>
                        <Text style={styles.avatarText}>
                          {item.username.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.podiumBadge}>{medalIcon}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{item.username}</Text>
                    <Text style={styles.podiumPoints}>{item.totalPoints} Pts</Text>
                    <View style={[styles.podiumBar, { height: podiumHeight, backgroundColor: isWinner ? '#10B981' : '#34D399' }]}>
                      <Text style={styles.podiumRankText}>#{item.rank}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* List for Rank 4 and below */}
          <View style={styles.listContainer}>
            <Text style={styles.listSectionTitle}>Peringkat Lainnya</Text>
            
            {restOfList.length === 0 && podiumItems.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyText}>Belum ada data peringkat saat ini</Text>
              </View>
            )}

            {restOfList.map((item) => (
              <View key={item.userId} style={styles.rankRow}>
                <View style={[styles.rankBadge, { backgroundColor: getRankBadgeColor(item.rank) }]}>
                  <Text style={[styles.rankBadgeText, { color: getRankBadgeTextColor(item.rank) }]}>
                    {item.rank}
                  </Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.username}</Text>
                  <Text style={styles.rowScans}>{item.scanCount} scan</Text>
                </View>
                <View style={styles.rowPointsContainer}>
                  <Text style={styles.rowPoints}>{item.totalPoints}</Text>
                  <Ionicons name="leaf-outline" size={13} color="#10B981" style={styles.rowPointsIcon} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Current User Fixed Bottom Rank Bar */}
      {currentUserRank && (
        <View style={styles.currentUserBar}>
          <View style={styles.currentUserLeft}>
            <View style={styles.currentUserRankBadge}>
              <Text style={styles.currentUserRankText}>
                {currentUserRank.rank}
              </Text>
            </View>
            <View style={styles.currentUserInfo}>
              <Text style={styles.currentUserTitle}>Peringkat Anda</Text>
              <Text style={styles.currentUserName}>{currentUserRank.username}</Text>
            </View>
          </View>
          <View style={styles.currentUserRight}>
            <Text style={styles.currentUserPoints}>{currentUserRank.totalPoints} Pts</Text>
            <Text style={styles.currentUserScans}>{currentUserRank.scanCount} scan</Text>
          </View>
        </View>
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E4E2C',
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#10B981',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  podiumWinnerCol: {
    marginHorizontal: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  podiumBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    fontSize: 20,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  podiumBar: {
    width: '80%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
  },
  podiumRankText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E4E2C',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rankBadgeText: {
    fontWeight: '700',
    fontSize: 14,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  rowScans: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rowPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rowPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 4,
  },
  rowPointsIcon: {
    marginTop: 1,
  },
  currentUserBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#1E4E2C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  currentUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserRankBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  currentUserRankText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  currentUserInfo: {
    justifyContent: 'center',
  },
  currentUserTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  currentUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  currentUserRight: {
    alignItems: 'flex-end',
  },
  currentUserPoints: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34D399',
  },
  currentUserScans: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
});
