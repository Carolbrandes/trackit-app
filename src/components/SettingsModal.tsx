import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useCurrency } from '../hooks/useCurrency';
import { useUserData } from '../hooks/useUserData';
import { updateUserCurrency, clearAuthToken } from '../services/api';
import { router } from 'expo-router';

type ThemeMode = 'light' | 'dark' | 'system';
type Locale = 'en' | 'pt' | 'es';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { theme, themeMode, setThemeMode } = useThemeContext();
  const { t, locale, setLocale } = useTranslation();
  const { currencies, selectedCurrencyCode } = useCurrency();
  const { refetch: refetchUser } = useUserData();
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  const handleLogout = async () => {
    await clearAuthToken();
    onClose();
    router.replace('/login');
  };

  const handleCurrencySelect = async (currencyId: string) => {
    setUpdatingCurrency(true);
    try {
      await updateUserCurrency(currencyId);
      await refetchUser();
    } catch {
      // ignore
    } finally {
      setUpdatingCurrency(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.box, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.gray300 }]}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t.sidebar.userSettings}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Theme</Text>
            <View style={styles.chipRow}>
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.chip, themeMode === mode && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setThemeMode(mode)}
                >
                  <Text style={[styles.chipText, { color: themeMode === mode ? '#fff' : theme.colors.textPrimary }]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Currency</Text>
            <View style={styles.chipRow}>
              {currencies.slice(0, 15).map((c) => (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.chip, selectedCurrencyCode === c.code && { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleCurrencySelect(c._id)}
                  disabled={updatingCurrency}
                >
                  <Text style={[styles.chipText, { color: selectedCurrencyCode === c.code ? '#fff' : theme.colors.textPrimary }]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Language</Text>
            <View style={styles.chipRow}>
              {(['en', 'pt', 'es'] as Locale[]).map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.chip, locale === loc && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setLocale(loc)}
                >
                  <Text style={[styles.chipText, { color: locale === loc ? '#fff' : theme.colors.textPrimary }]}>{loc.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.logoutBtn, { borderColor: theme.colors.danger }]} onPress={handleLogout}>
              <Text style={[styles.logoutText, { color: theme.colors.danger }]}>{t.sidebar.logout}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  box: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    maxHeight: 400,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
