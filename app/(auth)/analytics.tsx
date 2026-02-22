import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { useTranslation } from '../../src/contexts/LanguageContext';
import { useUserData } from '../../src/hooks/useUserData';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useCurrency } from '../../src/hooks/useCurrency';
import { formatCurrency } from '../../src/utils/formatters';
import { FinancialCharts, AiInsightsSection } from '../../src/components';

function getCategoryName(txn: { category: string | { name: string } | null }): string {
  if (typeof txn.category === 'object' && txn.category !== null && 'name' in txn.category) {
    return txn.category.name;
  }
  return 'Sem categoria';
}

function groupByCategory(transactions: { category: string | { name: string } | null; amount: number }[]) {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    const name = getCategoryName(tx);
    map.set(name, (map.get(name) || 0) + tx.amount);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

export default function AnalyticsScreen() {
  const { theme } = useThemeContext();
  const { t, locale } = useTranslation();
  const { user } = useUserData();
  const { selectedCurrencyCode } = useCurrency();

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

  const byCategory = useMemo(() => groupByCategory(allTransactions), [allTransactions]);

  const months = t.analytics.months.map((name, i) => ({ value: i + 1, name }));
  const years = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t.analytics.title}</Text>

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
                  <Text style={[styles.pickerChipText, { color: selectedMonth === m.value ? '#fff' : theme.colors.textPrimary }]}>{m.name}</Text>
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
                  <Text style={[styles.pickerChipText, { color: selectedYear === y ? '#fff' : theme.colors.textPrimary }]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {isLoading ? (
          <Text style={[styles.placeholder, { color: theme.colors.textSecondary }]}>{t.categories.loading}</Text>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{t.summary.income}</Text>
              <Text style={[styles.cardValue, { color: theme.colors.success }]}>
                {formatCurrency(totals.income, selectedCurrencyCode, locale)}
              </Text>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{t.summary.expense}</Text>
              <Text style={[styles.cardValue, { color: theme.colors.danger }]}>
                {formatCurrency(totals.expense, selectedCurrencyCode, locale)}
              </Text>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{t.summary.balance}</Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: totals.balance >= 0 ? theme.colors.success : theme.colors.danger },
                ]}
              >
                {formatCurrency(totals.balance, selectedCurrencyCode, locale)}
              </Text>
            </View>

            <FinancialCharts
              transactions={allTransactions}
              incomeTotal={totals.income}
              expenseTotal={totals.expense}
              theme={theme}
              t={t}
              formatCurrency={formatCurrency}
              currencyCode={selectedCurrencyCode}
              locale={locale}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />

            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Por categoria</Text>
            {byCategory.length === 0 ? (
              <Text style={[styles.placeholder, { color: theme.colors.textSecondary }]}>Nenhuma transação no período</Text>
            ) : (
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
                {byCategory.map(([name, amount]) => (
                  <View key={name} style={[styles.categoryRow, { borderBottomColor: theme.colors.gray300 }]}>
                    <Text style={[styles.categoryName, { color: theme.colors.textPrimary }]}>{name}</Text>
                    <Text style={[styles.categoryAmount, { color: theme.colors.textPrimary }]}>
                      {formatCurrency(amount, selectedCurrencyCode, locale)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <AiInsightsSection />
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
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryName: {
    fontSize: 15,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  placeholder: {
    fontSize: 14,
    paddingVertical: 16,
  },
});
