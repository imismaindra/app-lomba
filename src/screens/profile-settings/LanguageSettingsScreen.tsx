import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../../config';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SettingsLayout, settingsStyles as styles } from './SettingsLayout';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export default function LanguageSettingsScreen() {
  const { token } = useAuth();
  const { setLanguage, t } = useLanguage();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('id');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(`${API_URL}/languages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setLanguages(data.languages);
          setSelectedLanguage(data.selectedLanguage);
          setLanguage(data.selectedLanguage);
        }
      } catch (error) {
        Alert.alert('Gagal', t('settings.languageLoadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, [token]);

  const selectLanguage = async (languageCode: string) => {
    const previousLanguage = selectedLanguage;
    setSelectedLanguage(languageCode);
    setLanguage(languageCode);

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/languages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ languageCode }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setSelectedLanguage(previousLanguage);
        setLanguage(previousLanguage);
        Alert.alert('Gagal', data.error || t('settings.languageSaveFallback'));
      }
    } catch (error) {
      setSelectedLanguage(previousLanguage);
      setLanguage(previousLanguage);
      Alert.alert('Gagal', t('settings.languageSaveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsLayout title={t('settings.languageTitle')} subtitle={t('settings.languageSubtitle')}>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color="#10B981" />
        ) : (
          languages.map((language) => {
            const isSelected = selectedLanguage === language.code;
            return (
              <TouchableOpacity
                key={language.code}
                style={[styles.optionRow, isSelected && styles.optionRowActive]}
                onPress={() => selectLanguage(language.code)}
                disabled={saving}
              >
                <View>
                  <Text style={styles.rowTitle}>{language.nativeName}</Text>
                  <Text style={styles.rowSubtitle}>{language.name}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color="#10B981" />}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </SettingsLayout>
  );
}
