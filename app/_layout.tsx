import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { DateFormatProvider } from '../src/contexts/DateFormatContext';

function AuthExpiredHandler() {
  const router = useRouter();
  useEffect(() => {
    (global as { onAuthExpired?: () => void }).onAuthExpired = () => {
      router.replace('/login');
    };
    return () => {
      delete (global as { onAuthExpired?: () => void }).onAuthExpired;
    };
  }, [router]);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <DateFormatProvider>
            <AuthExpiredHandler />
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="terms" />
              <Stack.Screen name="(auth)" />
            </Stack>
          </DateFormatProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
