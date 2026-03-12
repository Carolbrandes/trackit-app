import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { AiInsightsSection } from '../AiInsightsSection';
import type { Translations } from '../../i18n/locales';
import type { Theme } from '../../styles/theme';

interface SummaryTabProps {
  totals: { income: number; expense: number; balance: number };
  currencyCode: string;
  locale: string;
  theme: Theme;
  t: Translations;
  formatCurrency: (amount: number, currencyCode: string, locale: string) => string;
}

const screenWidth = Dimensions.get('window').width;

export function SummaryTab({
  totals,
  currencyCode,
  locale,
  theme,
  t,
  formatCurrency,
}: SummaryTabProps) {
  const rawPercent = totals.income > 0 ? (totals.expense / totals.income) * 100 : 0;
  const clampedPercent = Math.min(rawPercent, 100);

  let statusColor = theme.colors.success;
  if (totals.expense > totals.income) statusColor = theme.colors.danger;
  else if (rawPercent >= 80) statusColor = theme.colors.warning;

  return (
    <>
      <AiInsightsSection />

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: theme.colors.success }]}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{t.summary.income}</Text>
          <Text style={[styles.metricValue, { color: theme.colors.success }]}>
            {formatCurrency(totals.income, currencyCode, locale)}
          </Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: theme.colors.danger }]}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{t.summary.expense}</Text>
          <Text style={[styles.metricValue, { color: theme.colors.danger }]}>
            {formatCurrency(totals.expense, currencyCode, locale)}
          </Text>
        </View>
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: totals.balance >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              borderColor: totals.balance >= 0 ? theme.colors.success : theme.colors.danger,
            },
          ]}
        >
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{t.summary.balance}</Text>
          <Text style={[styles.metricValue, { color: totals.balance >= 0 ? theme.colors.success : theme.colors.danger }]}>
            {formatCurrency(totals.balance, currencyCode, locale)}
          </Text>
        </View>
      </View>

      <View style={[styles.budgetCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
        <Text style={[styles.budgetTitle, { color: theme.colors.textPrimary }]}>
          {t.analytics.budgetProgress}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.gray200 }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${clampedPercent}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.budgetMeta, { color: theme.colors.textSecondary }]}>
          <Text style={{ fontWeight: '700', color: statusColor }}>{Math.round(rawPercent)}%</Text>
          {' '}{t.analytics.budgetOf}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: screenWidth < 380 ? 13 : 15,
    fontWeight: '700',
  },
  budgetCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  budgetMeta: {
    fontSize: 13,
  },
});
