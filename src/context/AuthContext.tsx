import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

interface User {
  id?: number;
  username: string;
  email: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: emailOrUsername.toLowerCase().trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login gagal' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Gagal terhubung ke server' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const loginResult = await login(email, password);
        if (!loginResult.success) {
          return {
            success: false,
            error: loginResult.error || 'Registrasi berhasil, tetapi login otomatis gagal',
          };
        }

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registrasi gagal' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Gagal terhubung ke server' };
    } finally {
      setIsLoading(false);
    }
  };

const logout = async () => {
  try {
    setIsLoading(true);
    console.log('Logout called - menghapus token dan user');
    
    // Hapus dari AsyncStorage
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    
    // KHUSUS WEB
    if (typeof window !== 'undefined') {
      localStorage.clear();  // Clear semua localStorage
      sessionStorage.clear();
      console.log('LocalStorage dan SessionStorage dibersihkan');
    }
    
    // Hapus dari state
    setToken(null);
    setUser(null);
    
    console.log('Logout berhasil, user sekarang:', null);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    setIsLoading(false);
  }
};

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      console.log('CheckSession - storedToken:', storedToken ? 'ada' : 'tidak ada');
      console.log('CheckSession - storedUser:', storedUser ? 'ada' : 'tidak ada');
      
      if (storedToken && storedUser) {
        // Setup AbortController for fetch timeout (5 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 5000);

        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${storedToken}` },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const data = await response.json();

          if (response.ok && data.success) {
            setToken(storedToken);
            setUser(data.user);
            console.log('Session valid, user:', data.user);
          } else {
            // Token expired atau invalid (bukan error jaringan)
            console.log('Session invalid, clearing storage');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          console.error('Fetch error saat verify session:', fetchError);
          
          // Jika error dikarenakan abort (timeout) atau kegagalan jaringan (offline),
          // gunakan data cache lokal daripada memaksa logout.
          if (
            fetchError.name === 'AbortError' ||
            fetchError.message?.toLowerCase().includes('network') ||
            fetchError.message?.toLowerCase().includes('failed to fetch')
          ) {
            console.log('Menggunakan sesi offline dengan cached credentials');
            setToken(storedToken);
            try {
              setUser(JSON.parse(storedUser));
            } catch (parseError) {
              setUser({ username: 'Eco User', email: '' }); // fallback jika JSON corrupt
            }
          } else {
            // Jika kesalahan lain (misal token corrupt yang ditolak oleh parser, dll)
            console.log('Kesalahan non-jaringan, menghapus penyimpanan lokal');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error('Check session error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
