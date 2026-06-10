import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

interface RegisterScreenProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type FieldType = 'username' | 'email' | 'password' | 'confirmPassword';

export default function RegisterScreen({
  showToast,
}: RegisterScreenProps) {
  const navigation = useNavigation<any>();
  const { register } = useAuth();
  const [focusedInput, setFocusedInput] = useState<FieldType | null>(null);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      showToast('Harap lengkapi semua kolom input!', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Password dan konfirmasi password tidak cocok!', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password minimal harus 6 karakter!', 'error');
      return;
    }

    setLoading(true);
    const result = await register(username, email, password);
    setLoading(false);

    if (result.success) {
      showToast('Registrasi berhasil! Silakan masuk.', 'success');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      navigation.navigate('Login');
    } else {
      showToast(result.error || 'Registrasi gagal. Coba lagi.', 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex1}
    >
      {/* Soft pastel ambient background glows */}
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Header Logo */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="leaf" size={40} color="#10B981" />
            <Ionicons name="add-circle-outline" size={40} color="#06B6D4" style={styles.scanIcon} />
          </View>
          <Text style={styles.appName}>ECHO TECH</Text>
          <Text style={styles.appSubtitle}>Selamatkan Bumi dengan Teknologi</Text>
        </View>

        {/* Register Form Card */}
        <View style={styles.card}>
          {/* Card Tech Accent Line */}
          <View style={styles.techAccentLine} />

          <Text style={styles.cardTitle}>Daftar Akun Baru</Text>

          <View
            style={[
              styles.inputContainer,
              focusedInput === 'username' && styles.inputContainerFocused,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={focusedInput === 'username' ? '#06B6D4' : '#94A3B8'}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#94A3B8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('username')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              focusedInput === 'email' && styles.inputContainerFocused,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={focusedInput === 'email' ? '#06B6D4' : '#94A3B8'}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Alamat Email"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              focusedInput === 'password' && styles.inputContainerFocused,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={focusedInput === 'password' ? '#06B6D4' : '#94A3B8'}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Kata Sandi (Min. 6 Karakter)"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              focusedInput === 'confirmPassword' && styles.inputContainerFocused,
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={focusedInput === 'confirmPassword' ? '#06B6D4' : '#94A3B8'}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Konfirmasi Kata Sandi"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('confirmPassword')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Daftar Akun</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Switch */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah memiliki akun?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Masuk Akun</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    position: 'relative',
    zIndex: 1,
  },
  glowCircle1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(16, 185, 129, 0.05)', // Soft light green glow
    zIndex: 0,
  },
  glowCircle2: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(6, 182, 212, 0.05)', // Soft light cyan glow
    zIndex: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 35,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    position: 'relative',
    marginBottom: 16,
  },
  scanIcon: {
    position: 'absolute',
    opacity: 0.8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A', // Dark slate text color for high contrast in light mode
    letterSpacing: 3,
    marginBottom: 4,
    textShadowColor: 'rgba(16, 185, 129, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    fontFamily: 'GeistSans-ExtraBold',
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748B', // Muted slate gray
    fontWeight: '500',
    fontFamily: 'GeistSans-Medium',
  },
  card: {
    backgroundColor: '#FFFFFF', // Pure white card
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Soft light gray border
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, // Soft light shadow
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  techAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#06B6D4', // Clean cyan top accent
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A', // Dark slate text
    marginBottom: 20,
    letterSpacing: 0.5,
    fontFamily: 'GeistSans-Bold',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC', // Extremely soft gray background for inputs
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0', // Light border
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: '#06B6D4', // Focus cyan
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#0F172A', // Dark text color for inputs
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'GeistSans-Regular',
    borderWidth: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  } as any,
  primaryButton: {
    backgroundColor: '#10B981', // Emerald green button looks crisp on white cards
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'GeistSans-Bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'GeistSans-Regular',
  },
  footerLink: {
    color: '#10B981',
    fontWeight: '700',
    marginLeft: 6,
    textDecorationLine: 'underline',
    fontFamily: 'GeistSans-Bold',
  },
});
