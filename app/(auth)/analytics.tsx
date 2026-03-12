import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { useTranslation } from '../../src/contexts/LanguageContext';
import { useUserData } from '../../src/hooks/useUserData';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useCurrency } from '../../src/hooks/useCurrency';
import { formatCurrency } from '../../src/utils/formatters';
import { SummaryTab } from '../../src/components/analytics/SummaryTab';
import { AnalysisTab } from '../../src/components/analytics/AnalysisTab';
import { ComparisonTab } from '../../src/components/analytics/ComparisonTab';

const TABS = [0, 1, 2] as const;

export default function AnalyticsScreen() {
  const { theme } = useThemeContext();
  const { t, locale } = useTranslation();
  const { user } = useUserData();
  const { selectedCurrencyCode } = useCurrency();

  const [activeTab, setActiveTab] = useState(0);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const filters = useMemo(() => ({
    startDate: new Date(selectedYear, selectedMonth - 1, 1).toISOString().slice(0, 10),
    endDate: new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10),
  }), [selectedMonth, selectedYear]);

  const { allTransactions, isLoading } = useTransactions(user?._id, 1, 9999, filters);

  const totals = useMemo(() => {
    return allTransactions.reduce(
      (acc, tx) => {
        if (tx.type === 'income') acc.income += tx.amount;
        else acc.expense += tx.amount;
        acc.balance = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, balance: 0 }
    );
  }, [allTransactions]);

  const months = t.analytics.months.map((name, i) => ({ value: i + 1, name }));
  const years = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i);

  const tabLabels = [t.analytics.summaryTab, t.analytics.analysisTab, t.analytics.comparisonTab];

  const showMonthYearFilters = activeTab !== 2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t.analytics.title}</Text>

        {/* Top Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: theme.colors.gray200, borderColor: theme.colors.gray300 }]}>
          {TABS.map((idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.tabItem,
                activeTab === idx && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setActiveTab(idx)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === idx ? '#fff' : theme.colors.textPrimary },
                ]}
              >
                {tabLabels[idx]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Month / Year selectors (Summary & Analysis only) */}
        {showMonthYearFilters && (
          <View style={[styles.filterRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>{t.analytics.month}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                {months.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    style={[styles.pickerChip, selectedMonth === m.value && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setSelectedMonth(m.value)}
                  >
                    <Text style={[styles.pickerChipText, { color: selectedMonth === m.value ? '#fff' : theme.colors.textPrimary }]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>{t.analytics.year}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.pickerChip, selectedYear === y && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setSelectedYear(y)}
                  >
                    <Text style={[styles.pickerChipText, { color: selectedYear === y ? '#fff' : theme.colors.textPrimary }]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Tab content */}
        {isLoading && showMonthYearFilters ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <>
            {activeTab === 0 && (
              <SummaryTab
                totals={totals}
                currencyCode={selectedCurrencyCode}
                locale={locale}
                theme={theme}
                t={t}
                formatCurrency={formatCurrency}
              />
            )}
            {activeTab === 1 && (
              <AnalysisTab
                transactions={allTransactions}
                currencyCode={selectedCurrencyCode}
                locale={locale}
                theme={theme}
                t={t}
                formatCurrency={formatCurrency}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            )}
            {activeTab === 2 && (
              <ComparisonTab
                userId={user?._id}
                theme={theme}
                t={t}
                locale={locale}
                currencyCode={selectedCurrencyCode}
                formatCurrency={formatCurrency}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  pickerRow: {
    maxHeight: 44,
  },
  pickerChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  pickerChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 40,
  },
});
