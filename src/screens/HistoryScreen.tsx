import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TextInput,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config';
import { useAuth } from '../context/AuthContext';

// Enable LayoutAnimation for Android (only if not running on New Architecture / Fabric)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  if (!(global as any).nativeFabricUIScheduler) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface ScanHistoryItem {
  id: string;
  wasteType: string;
  category: string;
  confidence: number;
  points: number;
  date: string;
}

// Warna berdasarkan kategori
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Organik':
      return '#4CAF50';
    case 'Anorganik':
      return '#2196F3';
    case 'B3':
      return '#F44336';
    default:
      return '#757575';
  }
};

// Icon berdasarkan kategori
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Organik':
      return 'leaf-outline';
    case 'Anorganik':
      return 'trash-outline';
    case 'B3':
      return 'warning-outline';
    default:
      return 'trash-outline';
  }
};

// Format tanggal
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Tips edukasi daur ulang kustom
const getRecyclingTips = (category: string, wasteType: string) => {
  const typeLower = wasteType.toLowerCase();
  
  if (category === 'Organik') {
    if (typeLower.includes('buah') || typeLower.includes('sayur') || typeLower.includes('makanan')) {
      return 'Pisahkan dari kemasan plastik. Potong kecil-kecil untuk mempercepat pembusukan, lalu masukkan ke komposter atau lubang biopori.';
    }
    if (typeLower.includes('daun') || typeLower.includes('ranting') || typeLower.includes('tanaman')) {
      return 'Dapat dijadikan mulsa alami untuk menjaga kelembapan tanah, atau dicampur dengan sampah organik basah di wadah pengomposan.';
    }
    return 'Masukkan ke wadah tertutup untuk dijadikan pupuk kompos cair atau padat secara higienis.';
  }
  
  if (category === 'Anorganik') {
    if (typeLower.includes('kardus') || typeLower.includes('karton')) {
      return 'Bilas dari noda minyak (jika bekas makanan), lipat kardus hingga benar-benar rata/pipih untuk menghemat ruang, lalu kumpulkan untuk bank sampah.';
    }
    if (typeLower.includes('plastik') || typeLower.includes('botol')) {
      return 'Kosongkan sisa cairan, bilas bersih, lepas label plastik & tutup botol, lalu remas hingga kempis agar mudah disalurkan ke daur ulang.';
    }
    if (typeLower.includes('kertas') || typeLower.includes('hvs')) {
      return 'Pastikan kertas tetap kering, tidak terkena minyak atau air. Kertas yang sudah disobek/dihancurkan juga sangat baik untuk didaur ulang.';
    }
    if (typeLower.includes('kaca') || typeLower.includes('beling')) {
      return 'Bilas bersih kaca, pisahkan dari tutupnya. Bungkus dengan aman jika terdapat retakan/pecah sebelum diserahkan ke pengepul daur ulang.';
    }
    if (typeLower.includes('logam') || typeLower.includes('kaleng')) {
      return 'Cuci bersih kaleng/logam dari sisa makanan/minuman, tekan/pipihkan jika memungkinkan, dan kumpulkan di wadah khusus logam kering.';
    }
    return 'Bersihkan dari kotoran atau sisa makanan, keringkan, lalu pilah sebelum diserahkan ke bank sampah terdekat untuk didaur ulang.';
  }
  
  if (category === 'B3') {
    if (typeLower.includes('baterai') || typeLower.includes('aki')) {
      return 'Jangan buang ke tempat sampah biasa! Mengandung logam berat berbahaya. Simpan dalam wadah plastik kering dan serahkan ke dropbox limbah B3.';
    }
    if (typeLower.includes('lampu') || typeLower.includes('bohlam')) {
      return 'Bungkus lampu bekas dengan koran atau bubble wrap agar tidak pecah dan melukai petugas. Salurkan ke pos pengumpulan limbah elektronik.';
    }
    return 'Limbah beracun dan berbahaya. Pisahkan di wadah khusus yang aman dari jangkauan anak-anak dan bawa ke tempat pengelolaan limbah B3 khusus.';
  }
  
  return 'Pastikan sampah dalam keadaan bersih dan kering sebelum dipilah dan disalurkan ke tempat pembuangan atau bank sampah terdekat.';
};

// Item Card Component (Expandable)
const HistoryItem = ({ 
  item, 
  isExpanded, 
  onToggleExpand 
}: { 
  item: ScanHistoryItem; 
  isExpanded: boolean; 
  onToggleExpand: () => void;
}) => {
  const categoryColor = getCategoryColor(item.category);
  const categoryIcon = getCategoryIcon(item.category);
  
  // Confidence level pill styling
  let confidenceColor = '#F59E0B'; // Medium default
  let confidenceLabel = 'Akurasi Sedang';
  if (item.confidence >= 0.75) {
    confidenceColor = '#10B981'; // High
    confidenceLabel = 'Akurasi Tinggi';
  } else if (item.confidence < 0.5) {
    confidenceColor = '#EF4444'; // Low
    confidenceLabel = 'Akurasi Rendah';
  }

  const tips = getRecyclingTips(item.category, item.wasteType);

  return (
    <TouchableOpacity 
      style={[
        styles.historyCard, 
        isExpanded && { borderColor: categoryColor, borderWidth: 1.5, shadowOpacity: 0.08 }
      ]}
      onPress={onToggleExpand}
      activeOpacity={0.9}
    >
      <View style={styles.cardMainRow}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
          <Ionicons name={categoryIcon as any} size={24} color={categoryColor} />
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.wasteType}>{item.wasteType}</Text>
            <Text style={[styles.points, { color: categoryColor }]}>+{item.points} Poin</Text>
          </View>
          
          <View style={styles.cardDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={13} color="#757575" />
              <Text style={styles.detailText}>{item.category}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={13} color="#757575" />
              <Text style={styles.detailText}>{formatDate(item.date)}</Text>
            </View>
          </View>
        </View>
        
        <Ionicons 
          name={isExpanded ? "chevron-down" : "chevron-forward"} 
          size={18} 
          color="#94A3B8" 
          style={{ marginLeft: 8 }}
        />
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          
          {/* AI Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Kecocokan AI</Text>
              <View style={styles.metricValueWrapper}>
                <View style={[styles.dot, { backgroundColor: confidenceColor }]} />
                <Text style={[styles.metricValue, { color: confidenceColor }]}>
                  {Math.round(item.confidence * 100)}% ({confidenceLabel})
                </Text>
              </View>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Waktu Pindai</Text>
              <Text style={styles.metricValue}>
                {new Date(item.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </Text>
            </View>
          </View>

          {/* Educational tips block */}
          <View style={[styles.tipsBox, { backgroundColor: categoryColor + '08', borderColor: categoryColor + '18' }]}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={16} color={categoryColor} />
              <Text style={[styles.tipsTitle, { color: categoryColor }]}>Tips Penanganan & Daur Ulang</Text>
            </View>
            <Text style={styles.tipsText}>{tips}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Empty State Component
const EmptyState = ({ onCtaPress }: { onCtaPress: () => void }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="camera-outline" size={48} color="#4CAF50" />
    </View>
    <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
    <Text style={styles.emptySubtitle}>
      Mulai scan sampah pertama Anda dengan AI Detektor kami untuk mengumpulkan Eco Poin!
    </Text>
    <TouchableOpacity 
      style={styles.emptyCtaButton}
      onPress={onCtaPress}
      activeOpacity={0.8}
    >
      <Ionicons name="scan" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
      <Text style={styles.emptyCtaText}>Pindai Sekarang</Text>
    </TouchableOpacity>
  </View>
);

export default function HistoryScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (showInitialLoading = false) => {
    if (!token) {
      setHistory([]);
      setError('Silakan login untuk melihat riwayat scan.');
      setLoading(false);
      return;
    }

    try {
      if (showInitialLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${API_URL}/scan-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const responseText = await response.text();
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') && responseText
        ? JSON.parse(responseText)
        : null;

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
          'Endpoint riwayat belum aktif. Restart backend, lalu buka ulang halaman History.'
        );
      }

      setHistory(data.history || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat riwayat scan');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory(true);
    }, [fetchHistory])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory(false);
    setRefreshing(false);
  };

  const toggleExpandCard = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  const handleScanCta = () => {
    navigation.navigate('Scan');
  };

  // Filter and Search Logic
  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.wasteType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFilter === 'Semua' || item.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPoints = history.reduce((sum, item) => sum + item.points, 0);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E4E2C" />
        <Text style={styles.loadingText}>Memuat riwayat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FAF6" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Riwayat Scan</Text>
          <Text style={styles.headerSubtitle}>
            {filteredHistory.length} item terdeteksi
          </Text>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Statistik Ringkas */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(76, 175, 80, 0.08)' }]}>
              <Ionicons name="leaf-outline" size={18} color="#4CAF50" />
            </View>
            <Text style={styles.statVal}>{totalPoints}</Text>
            <Text style={styles.statLbl}>Total Poin</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(33, 150, 243, 0.08)' }]}>
              <Ionicons name="camera-outline" size={18} color="#2196F3" />
            </View>
            <Text style={styles.statVal}>{history.length}</Text>
            <Text style={styles.statLbl}>Total Scan</Text>
          </View>
        </View>

        {/* Search & Filter Section */}
        <View style={styles.searchFilterContainer}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari sampah..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={(text) => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSearchQuery(text);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills */}
          <View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.filterPills}
            >
              {['Semua', 'Organik', 'Anorganik', 'B3'].map((filter) => {
                const isActive = activeFilter === filter;
                let activeBg = '#1E4E2C';
                if (isActive) {
                  if (filter === 'Organik') activeBg = '#4CAF50';
                  else if (filter === 'Anorganik') activeBg = '#2196F3';
                  else if (filter === 'B3') activeBg = '#F44336';
                }
                
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterPill,
                      isActive ? { backgroundColor: activeBg, borderColor: activeBg } : styles.filterPillInactive
                    ]}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setActiveFilter(filter);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterPillText, isActive ? styles.filterPillTextActive : styles.filterPillTextInactive]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* List History */}
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryItem 
              item={item} 
              isExpanded={expandedCardId === item.id} 
              onToggleExpand={() => toggleExpandCard(item.id)} 
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1E4E2C']}
              tintColor="#1E4E2C"
            />
          }
          ListEmptyComponent={() => <EmptyState onCtaPress={handleScanCta} />}
        />
      </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4FAF6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'GeistSans-Medium',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#133B1C',
    fontFamily: 'GeistSans-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontFamily: 'GeistSans-Regular',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
    fontFamily: 'GeistSans-Medium',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
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
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statVal: {
    fontSize: 18,
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
  searchFilterContainer: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Regular',
    padding: 0,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingBottom: 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EAF2EC',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 110,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAF2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  categoryBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  wasteType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
  },
  points: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'GeistSans-Regular',
  },
  expandedContent: {
    marginTop: 12,
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'GeistSans-Regular',
  },
  metricValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1C',
    fontFamily: 'GeistSans-Bold',
    marginTop: 2,
  },
  tipsBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
  tipsText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontFamily: 'GeistSans-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1C',
    marginBottom: 8,
    fontFamily: 'GeistSans-Bold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: 'GeistSans-Regular',
    lineHeight: 20,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E4E2C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 18,
    shadowColor: '#1E4E2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'GeistSans-Bold',
  },
});

