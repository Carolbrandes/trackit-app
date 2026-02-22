import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { PiggyBank } from 'lucide-react-native';
import { SafeArea } from '../src/styles/safeArea';
import { useThemeContext } from '../src/contexts/ThemeContext';
import { useTranslation } from '../src/contexts/LanguageContext';
import { api, setAuthToken } from '../src/services/api';
import { Spinner } from '../src/components/Spinner';

export default function LoginScreen() {
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    try {
      setIsLoading(true);
      await api.post('/api/auth/send-code', { email: email.trim() });
      setIsCodeSent(true);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to send code';
      Alert.alert('Error', message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!email.trim() || !code.trim()) {
      Alert.alert('Error', 'Please enter email and verification code');
      return;
    }
    try {
      setIsLoading(true);
      const { data } = await api.post<{ success: boolean; token?: string }>(
        '/api/auth/verify-code-mobile',
        { email: email.trim(), code: code.trim() }
      );
      if (data.success && data.token) {
        await setAuthToken(data.token);
        router.replace('/(auth)');
      } else {
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to verify code';
      Alert.alert('Error', message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const dynamicStyles = {
    container: { backgroundColor: theme.colors.background },
    headerText: { color: theme.colors.primary },
    box: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.gray300,
    },
    title: { color: theme.colors.textPrimary },
    input: {
      borderColor: theme.colors.gray300,
      backgroundColor: theme.colors.background,
      color: theme.colors.textPrimary,
    },
    inputPlaceholder: theme.colors.textSecondary,
    button: { backgroundColor: theme.colors.primary },
    buttonDisabled: { opacity: 0.6 },
    termsLink: { color: theme.colors.textSecondary },
  };

  return (
    <SafeArea style={StyleSheet.flatten([styles.safeArea, dynamicStyles.container])}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <PiggyBank size={45} color={theme.colors.primary} strokeWidth={2} />
            <Text style={[styles.headerTitle, dynamicStyles.headerText]}>
              Track It
            </Text>
          </View>

          <View style={[styles.box, dynamicStyles.box]}>
            <Text style={[styles.title, dynamicStyles.title]}>
              {t.login.title}
            </Text>

            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder={t.login.emailPlaceholder}
              placeholderTextColor={dynamicStyles.inputPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            {isCodeSent && (
              <>
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  placeholder={t.login.codePlaceholder}
                  placeholderTextColor={dynamicStyles.inputPlaceholder}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={[
                    styles.button,
                    dynamicStyles.button,
                    isLoading && dynamicStyles.buttonDisabled,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <View style={styles.buttonContent}>
                      <Spinner />
                      <Text style={styles.buttonText}>
                        {t.login.verifyingCode}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>{t.login.verifyCode}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {!isCodeSent && (
              <TouchableOpacity
                style={[
                  styles.button,
                  dynamicStyles.button,
                  isLoading && dynamicStyles.buttonDisabled,
                ]}
                onPress={handleSendCode}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.buttonContent}>
                    <Spinner />
                    <Text style={styles.buttonText}>{t.login.sendingCode}</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>{t.login.sendCode}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <Link href="/terms" asChild>
            <TouchableOpacity style={styles.termsContainer} activeOpacity={0.7}>
              <Text style={[styles.termsLink, dynamicStyles.termsLink]}>
                {t.terms.pageTitle}
              </Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '700',
  },
  box: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  button: {
    width: '100%',
    height: 44,
    marginTop: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  termsContainer: {
    marginTop: 20,
  },
  termsLink: {
    fontSize: 13,
  },
});
