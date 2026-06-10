import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type LanguageCode = 'id' | 'en' | 'jv' | 'su';

type TranslationKey =
  | 'profile.title'
  | 'profile.defaultUser'
  | 'profile.totalScan'
  | 'profile.ecoPoints'
  | 'profile.tree'
  | 'profile.accountSettings'
  | 'profile.editProfile'
  | 'profile.editProfileSubtitle'
  | 'profile.changePassword'
  | 'profile.changePasswordSubtitle'
  | 'profile.notifications'
  | 'profile.notificationsSubtitle'
  | 'profile.language'
  | 'profile.languageSubtitle'
  | 'profile.help'
  | 'profile.helpSubtitle'
  | 'profile.about'
  | 'profile.aboutSubtitle'
  | 'profile.logout'
  | 'settings.languageTitle'
  | 'settings.languageSubtitle'
  | 'settings.languageLoadError'
  | 'settings.languageSaveError'
  | 'settings.languageSaveFallback'
  | 'settings.editProfileTitle'
  | 'settings.editProfileSubtitle'
  | 'settings.changePasswordTitle'
  | 'settings.changePasswordSubtitle'
  | 'settings.notificationsTitle'
  | 'settings.notificationsSubtitle'
  | 'settings.helpTitle'
  | 'settings.helpSubtitle'
  | 'settings.aboutTitle'
  | 'settings.aboutSubtitle';

const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  id: {
    'profile.title': 'Profil Saya',
    'profile.defaultUser': 'Pengguna',
    'profile.totalScan': 'Total Scan',
    'profile.ecoPoints': 'Eco Poin',
    'profile.tree': 'Pohon',
    'profile.accountSettings': 'Pengaturan Akun',
    'profile.editProfile': 'Edit Profil',
    'profile.editProfileSubtitle': 'Ubah data diri Anda',
    'profile.changePassword': 'Ubah Password',
    'profile.changePasswordSubtitle': 'Keamanan akun Anda',
    'profile.notifications': 'Notifikasi',
    'profile.notificationsSubtitle': 'Atur notifikasi Anda',
    'profile.language': 'Bahasa',
    'profile.languageSubtitle': 'Indonesia',
    'profile.help': 'Bantuan',
    'profile.helpSubtitle': 'Pusat bantuan & FAQ',
    'profile.about': 'Tentang Aplikasi',
    'profile.aboutSubtitle': 'Versi 1.0.0',
    'profile.logout': 'Keluar Akun',
    'settings.languageTitle': 'Bahasa',
    'settings.languageSubtitle': 'Daftar bahasa diambil dari API backend.',
    'settings.languageLoadError': 'Tidak dapat memuat daftar bahasa.',
    'settings.languageSaveError': 'Tidak dapat menyimpan pilihan bahasa.',
    'settings.languageSaveFallback': 'Bahasa gagal disimpan.',
    'settings.editProfileTitle': 'Edit Profil',
    'settings.editProfileSubtitle': 'Data awal diambil dari profil akun Anda.',
    'settings.changePasswordTitle': 'Ubah Password',
    'settings.changePasswordSubtitle': 'Masukkan password saat ini dan password baru dua kali.',
    'settings.notificationsTitle': 'Notifikasi',
    'settings.notificationsSubtitle': 'Pengaturan ini disimpan lewat backend.',
    'settings.helpTitle': 'Bantuan',
    'settings.helpSubtitle': 'Pusat bantuan penggunaan Echo Tech.',
    'settings.aboutTitle': 'Tentang Aplikasi',
    'settings.aboutSubtitle': 'Echo Tech v1.0.0',
  },
  en: {
    'profile.title': 'My Profile',
    'profile.defaultUser': 'User',
    'profile.totalScan': 'Total Scans',
    'profile.ecoPoints': 'Eco Points',
    'profile.tree': 'Trees',
    'profile.accountSettings': 'Account Settings',
    'profile.editProfile': 'Edit Profile',
    'profile.editProfileSubtitle': 'Update your personal data',
    'profile.changePassword': 'Change Password',
    'profile.changePasswordSubtitle': 'Keep your account secure',
    'profile.notifications': 'Notifications',
    'profile.notificationsSubtitle': 'Manage your notifications',
    'profile.language': 'Language',
    'profile.languageSubtitle': 'English',
    'profile.help': 'Help',
    'profile.helpSubtitle': 'Help center & FAQ',
    'profile.about': 'About App',
    'profile.aboutSubtitle': 'Version 1.0.0',
    'profile.logout': 'Sign Out',
    'settings.languageTitle': 'Language',
    'settings.languageSubtitle': 'Language list is loaded from the backend API.',
    'settings.languageLoadError': 'Unable to load language list.',
    'settings.languageSaveError': 'Unable to save language preference.',
    'settings.languageSaveFallback': 'Failed to save language.',
    'settings.editProfileTitle': 'Edit Profile',
    'settings.editProfileSubtitle': 'Existing data is loaded from your account profile.',
    'settings.changePasswordTitle': 'Change Password',
    'settings.changePasswordSubtitle': 'Enter your current password and the new password twice.',
    'settings.notificationsTitle': 'Notifications',
    'settings.notificationsSubtitle': 'These settings are saved through the backend.',
    'settings.helpTitle': 'Help',
    'settings.helpSubtitle': 'Echo Tech usage help center.',
    'settings.aboutTitle': 'About App',
    'settings.aboutSubtitle': 'Echo Tech v1.0.0',
  },
  jv: {
    'profile.title': 'Profil Kula',
    'profile.defaultUser': 'Panganggo',
    'profile.totalScan': 'Total Scan',
    'profile.ecoPoints': 'Eco Poin',
    'profile.tree': 'Wit',
    'profile.accountSettings': 'Setelan Akun',
    'profile.editProfile': 'Sunting Profil',
    'profile.editProfileSubtitle': 'Ganti data pribadi panjenengan',
    'profile.changePassword': 'Ganti Sandi',
    'profile.changePasswordSubtitle': 'Keamanan akun panjenengan',
    'profile.notifications': 'Notifikasi',
    'profile.notificationsSubtitle': 'Atur notifikasi panjenengan',
    'profile.language': 'Basa',
    'profile.languageSubtitle': 'Basa Jawa',
    'profile.help': 'Pitulung',
    'profile.helpSubtitle': 'Pusat pitulung & FAQ',
    'profile.about': 'Babagan Aplikasi',
    'profile.aboutSubtitle': 'Versi 1.0.0',
    'profile.logout': 'Metu Akun',
    'settings.languageTitle': 'Basa',
    'settings.languageSubtitle': 'Dhaptar basa dijupuk saka API backend.',
    'settings.languageLoadError': 'Ora bisa ngemot dhaptar basa.',
    'settings.languageSaveError': 'Ora bisa nyimpen pilihan basa.',
    'settings.languageSaveFallback': 'Gagal nyimpen basa.',
    'settings.editProfileTitle': 'Sunting Profil',
    'settings.editProfileSubtitle': 'Data awal dijupuk saka profil akun panjenengan.',
    'settings.changePasswordTitle': 'Ganti Sandi',
    'settings.changePasswordSubtitle': 'Lebokna sandi saiki lan sandi anyar kaping pindho.',
    'settings.notificationsTitle': 'Notifikasi',
    'settings.notificationsSubtitle': 'Setelan iki disimpen liwat backend.',
    'settings.helpTitle': 'Pitulung',
    'settings.helpSubtitle': 'Pusat pitulung nggunakake Echo Tech.',
    'settings.aboutTitle': 'Babagan Aplikasi',
    'settings.aboutSubtitle': 'Echo Tech v1.0.0',
  },
  su: {
    'profile.title': 'Profil Abdi',
    'profile.defaultUser': 'Pamaké',
    'profile.totalScan': 'Total Scan',
    'profile.ecoPoints': 'Eco Poin',
    'profile.tree': 'Tangkal',
    'profile.accountSettings': 'Setélan Akun',
    'profile.editProfile': 'Robah Profil',
    'profile.editProfileSubtitle': 'Robah data diri anjeun',
    'profile.changePassword': 'Robah Sandi',
    'profile.changePasswordSubtitle': 'Kaamanan akun anjeun',
    'profile.notifications': 'Bewara',
    'profile.notificationsSubtitle': 'Atur bewara anjeun',
    'profile.language': 'Basa',
    'profile.languageSubtitle': 'Basa Sunda',
    'profile.help': 'Bantosan',
    'profile.helpSubtitle': 'Pusat bantosan & FAQ',
    'profile.about': 'Ngeunaan Aplikasi',
    'profile.aboutSubtitle': 'Vérsi 1.0.0',
    'profile.logout': 'Kaluar Akun',
    'settings.languageTitle': 'Basa',
    'settings.languageSubtitle': 'Daptar basa dicokot tina API backend.',
    'settings.languageLoadError': 'Teu tiasa muka daptar basa.',
    'settings.languageSaveError': 'Teu tiasa nyimpen pilihan basa.',
    'settings.languageSaveFallback': 'Gagal nyimpen basa.',
    'settings.editProfileTitle': 'Robah Profil',
    'settings.editProfileSubtitle': 'Data awal dicokot tina profil akun anjeun.',
    'settings.changePasswordTitle': 'Robah Sandi',
    'settings.changePasswordSubtitle': 'Lebetkeun sandi ayeuna jeung sandi anyar dua kali.',
    'settings.notificationsTitle': 'Bewara',
    'settings.notificationsSubtitle': 'Setélan ieu disimpen liwat backend.',
    'settings.helpTitle': 'Bantosan',
    'settings.helpSubtitle': 'Pusat bantosan panggunaan Echo Tech.',
    'settings.aboutTitle': 'Ngeunaan Aplikasi',
    'settings.aboutSubtitle': 'Echo Tech v1.0.0',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: string) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('id');

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: string) => {
        if (nextLanguage in translations) {
          setLanguageState(nextLanguage as LanguageCode);
        }
      },
      t: (key: TranslationKey) => translations[language][key] || translations.id[key],
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
