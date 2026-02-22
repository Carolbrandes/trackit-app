import { Text, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { SafeArea } from '../src/styles/safeArea';
import { useThemeContext } from '../src/contexts/ThemeContext';
import { useTranslation } from '../src/contexts/LanguageContext';

export default function TermsScreen() {
  const { theme } = useThemeContext();
  const { t } = useTranslation();

  return (
    <SafeArea style={StyleSheet.flatten([styles.container, { backgroundColor: theme.colors.background }])}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {t.terms.pageTitle}
        </Text>
        <Text style={[styles.placeholder, { color: theme.colors.textSecondary }]}>
          Terms content placeholder. Full content to be added.
        </Text>
        <Link href="/login" asChild>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Back to login</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
