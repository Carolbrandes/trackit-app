import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import type { Transaction } from '../../hooks/useTransactions';
import type { Translations } from '../../i18n/locales';
import type { Theme } from '../../styles/theme';

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
  '#eab308', '#64748b', '#78716c', '#3b82f6', '#22c55e',
];

function getCategoryName(txn: Transaction): string {
  if (typeof txn.category === 'object' && txn.category !== null && 'name' in txn.category) {
    return (txn.category as { name: string }).name;
  }
  return 'N/A';
}

function groupByCategory(transactions: Transaction[]): [string, number][] {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    const name = getCategoryName(tx);
    map.set(name, (map.get(name) || 0) + tx.amount);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

interface AnalysisTabProps {
  transactions: Transaction[];
  currencyCode: string;
  locale: string;
  theme: Theme;
  t: Translations;
  formatCurrency: (amount: number, currencyCode: string, locale: string) => string;
  selectedMonth: number;
  selectedYear: number;
}

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 64;
const pieRadius = Math.min(90, (chartWidth / 2 - 24) / 2);

export function AnalysisTab({
  transactions,
  currencyCode,
  locale,
  theme,
  t,
  formatCurrency,
  selectedMonth,
  selectedYear,
}: AnalysisTabProps) {
  const [fixedOnly, setFixedOnly] = useState(false);

  const filtered = useMemo(
    () => (fixedOnly ? transactions.filter((tx) => tx.is_fixed) : transactions),
    [transactions, fixedOnly]
  );

  const income = useMemo(() => filtered.filter((tx) => tx.type === 'income'), [filtered]);
  const expense = useMemo(() => filtered.filter((tx) => tx.type === 'expense'), [filtered]);
  const incomeByCategory = useMemo(() => groupByCategory(income), [income]);
  const expenseByCategory = useMemo(() => groupByCategory(expense), [expense]);
  const incomeTotal = useMemo(() => income.reduce((s, tx) => s + tx.amount, 0), [income]);
  const expenseTotal = useMemo(() => expense.reduce((s, tx) => s + tx.amount, 0), [expense]);

  const monthLabel = new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
    locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US',
    { month: 'long', year: 'numeric' }
  );

  const isEmpty = income.length === 0 && expense.length === 0;

  const incomePieData = incomeByCategory.map(([name, amount], i) => ({
    value: amount,
    color: COLORS[i % COLORS.length],
    text: name,
  }));

  const expenseBarData = expenseByCategory.map(([name, amount], i) => ({
    value: amount,
    label: name.length > 10 ? `${name.slice(0, 9)}…` : name,
    frontColor: COLORS[i % COLORS.length],
  }));

  return (
    <>
      <View style={[styles.toggleRow, { backgroundColor: theme.colors.gray200, borderColor: theme.colors.gray300 }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, !fixedOnly && { backgroundColor: theme.colors.primary }]}
          onPress={() => setFixedOnly(false)}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, { color: !fixedOnly ? '#fff' : theme.colors.textPrimary }]}>
            {t.analytics.general}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, fixedOnly && { backgroundColor: theme.colors.primary }]}
          onPress={() => setFixedOnly(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, { color: fixedOnly ? '#fff' : theme.colors.textPrimary }]}>
            {t.analytics.fixedOnlyToggle}
          </Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {fixedOnly ? t.analytics.noFixedTransactions : t.analytics.noTransactions} {monthLabel}
          </Text>
        </View>
      ) : (
        <>
          {incomeByCategory.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
              <Text style={[styles.chartTitle, { color: theme.colors.textPrimary }]}>
                {t.analytics.incomeByCategory}
              </Text>
              <View style={styles.pieContainer}>
                <PieChart
                  data={incomePieData}
                  radius={pieRadius}
                  showText={false}
                  focusOnPress
                  donut={false}
                />
              </View>
              <View style={styles.legendContainer}>
                {incomeByCategory.map(([name, amount], i) => (
                  <View key={name} style={styles.legendItem}>
                    <View style={[styles.colorBox, { backgroundColor: COLORS[i % COLORS.length] }]} />
                    <Text style={[styles.legendName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={[styles.legendValue, { color: theme.colors.textSecondary }]}>
                      {formatCurrency(amount, currencyCode, locale)} ({incomeTotal > 0 ? Math.round((amount / incomeTotal) * 100) : 0}%)
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {expenseByCategory.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
              <Text style={[styles.chartTitle, { color: theme.colors.textPrimary }]}>
                {t.analytics.expensesByCategory}
              </Text>
              <View style={styles.barContainer}>
                <BarChart
                  data={expenseBarData}
                  horizontal
                  barWidth={22}
                  spacing={12}
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  noOfSections={4}
                  maxValue={Math.max(...expenseBarData.map((d) => d.value), 1) * 1.1}
                  width={chartWidth}
                  containerHeight={Math.max(120, expenseBarData.length * 36)}
                  yAxisLabelWidth={70}
                  showFractionalValues={false}
                />
              </View>
              <View style={styles.legendContainer}>
                {expenseByCategory.map(([name, amount], i) => (
                  <View key={name} style={styles.legendItem}>
                    <View style={[styles.colorBox, { backgroundColor: COLORS[i % COLORS.length] }]} />
                    <Text style={[styles.legendName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={[styles.legendValue, { color: theme.colors.textSecondary }]}>
                      {formatCurrency(amount, currencyCode, locale)} ({expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0}%)
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  barContainer: {
    overflow: 'hidden',
    marginBottom: 8,
  },
  legendContainer: {
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  colorBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 8,
  },
  legendName: {
    flex: 1,
    fontSize: 13,
  },
  legendValue: {
    fontSize: 12,
    marginLeft: 4,
  },
});
