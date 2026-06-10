import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Slide {
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const SLIDES: Slide[] = [
  {
    title: "Selamat Datang di EcoClassify",
    description: "Aplikasi pintar untuk membantu Anda mengklasifikasikan sampah dengan teknologi AI yang canggih.",
    icon: "leaf",
  },
  {
    title: "Klasifikasi Sampah Cepat",
    description: "Cukup ambil foto sampah Anda dan model AI akan memilahnya secara cepat dan akurat.",
    icon: "image-filter-center-focus",
  },
  {
    title: "Selamatkan Lingkungan",
    description: "Kurangi jejak karbon bumi kita dengan memastikan setiap sampah masuk ke jalur daur ulang yang tepat.",
    icon: "earth",
  },
  {
    title: "Dapatkan Eco Poin",
    description: "Raih poin ramah lingkungan untuk setiap pemilahan sampah yang berhasil dan tukarkan dengan reward.",
    icon: "gift-outline",
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideX = useRef(new Animated.Value(0)).current;
  const slideOpacity = useRef(new Animated.Value(1)).current;

  const animateToLogin = () => {
    setIsAnimating(true);
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: -SCREEN_WIDTH,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(slideOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
      navigation.navigate('Login');
    });
  };

  const goToNextSlide = () => {
    if (isAnimating) return;

    if (currentSlide === SLIDES.length - 1) {
      animateToLogin();
      return;
    }

    setIsAnimating(true);
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: -SCREEN_WIDTH,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(slideOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentSlide((prev) => prev + 1);
      slideX.setValue(SCREEN_WIDTH);

      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(slideOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setIsAnimating(false));
    });
  };

  return (
    <View style={styles.onboardingContainer}>
      {/* Top Area: Skip Button */}
      <View style={styles.onboardingHeader}>
        <TouchableOpacity onPress={animateToLogin} style={styles.skipBtn} disabled={isAnimating}>
          <Text style={styles.skipBtnText}>Lewati</Text>
        </TouchableOpacity>
      </View>

      {/* Middle Area: Circles & Text */}
      <Animated.View
        style={[
          styles.onboardingMiddle,
          {
            opacity: slideOpacity,
            transform: [{ translateX: slideX }],
          },
        ]}
      >
        <View style={styles.outerCircle}>
          <View style={styles.middleCircle}>
            <View style={styles.innerCircle}>
              <MaterialCommunityIcons name={SLIDES[currentSlide].icon} size={64} color="#38a154" />
            </View>
          </View>
        </View>

        <Text style={styles.onboardingTitle}>{SLIDES[currentSlide].title}</Text>
        <Text style={styles.onboardingDesc}>{SLIDES[currentSlide].description}</Text>
      </Animated.View>

      {/* Bottom Area: Indicators & Button */}
      <View style={styles.onboardingBottom}>
        <View style={styles.indicatorRow}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicatorDot,
                currentSlide === index && styles.indicatorDotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.onboardingButton}
          onPress={goToNextSlide}
          disabled={isAnimating}
        >
          <Text style={styles.onboardingButtonText}>
            {currentSlide === SLIDES.length - 1 ? 'Mulai Sekarang' : 'Selanjutnya'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#38a154" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#38a154', // Green background
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 40,
  },
  onboardingHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 40,
    alignItems: 'center',
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'GeistSans-SemiBold',
    opacity: 0.9,
  },
  onboardingMiddle: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  outerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff', // Solid white circle
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 16,
    lineHeight: 32,
    letterSpacing: 0.5,
    fontFamily: 'GeistSans-Bold',
  },
  onboardingDesc: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.85,
    paddingHorizontal: 12,
    fontFamily: 'GeistSans-Regular',
  },
  onboardingBottom: {
    width: '100%',
    alignItems: 'center',
    gap: 30,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginHorizontal: 5,
  },
  indicatorDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  onboardingButton: {
    width: '100%',
    backgroundColor: '#f1f5f2', // off-white
    borderRadius: 20,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  onboardingButtonText: {
    color: '#38a154',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'GeistSans-Bold',
  },
});
