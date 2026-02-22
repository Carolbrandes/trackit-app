import { useState } from 'react';
import { Tabs } from 'expo-router';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { useTranslation } from '../../src/contexts/LanguageContext';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Settings, PiggyBank, Receipt, FolderOpen, BarChart3 } from 'lucide-react-native';
import { SettingsModal } from '../../src/components/SettingsModal';

export default function AuthLayout() {
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.gray300 }]}>
        <View style={styles.headerPlaceholder} />
        <View style={styles.headerCenter}>
          <PiggyBank size={24} color={theme.colors.primary} style={styles.logoIcon} />
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Track It</Text>
        </View>
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.headerRight} hitSlop={12}>
          <Settings size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.gray300,
          },
          tabBarLabelStyle: { fontSize: 12 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.sidebar.transactions,
            tabBarLabel: t.sidebar.transactions,
            tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: t.sidebar.categories,
            tabBarLabel: t.sidebar.categories,
            tabBarIcon: ({ color, size }) => <FolderOpen size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: t.sidebar.financialAnalytics,
            tabBarLabel: t.sidebar.financialAnalytics,
            tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}


const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerPlaceholder: { width: 40 },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: { marginRight: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    padding: 4,
    width: 40,
    alignItems: 'flex-end',
  },
});
