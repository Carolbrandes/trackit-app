import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Cpu,
  BarChart2,
  AlertTriangle,
  Eye,
  DollarSign,
  TrendingUp,
  Target,
  Zap,
  RefreshCw,
  CheckCircle,
} from 'lucide-react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/LanguageContext';
import { fetchInsights, type InsightsData } from '../services/api';

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
});

function formatCurrency(value: number, locale: string): string {
  return value.toLocaleString(
    locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );
}

export function AiInsightsSection() {
  const { theme } = useThemeContext();
  const { t, locale } = useTranslation();
  const insights = t.insights;
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const fetchInsightsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchInsights(locale);

      if (!result.success) {
        const errorMap: Record<string, string> = {
          NO_TRANSACTIONS: insights.noTransactions,
          RATE_LIMIT: insights.rateLimitError,
        };
        setError(errorMap[result.error ?? ''] || insights.genericError);
        setData(null);
        return;
      }

      if (result.data) {
        setData(result.data);
      }
    } catch {
      setError(insights.genericError);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsightsData();
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const animation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [isLoading, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.panel}>
      <View style={[styles.header, { borderBottomColor: theme.colors.gray300 }]}>
        <View style={styles.titleRow}>
          <Cpu size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{insights.title}</Text>
        </View>
        <TouchableOpacity
          onPress={fetchInsightsData}
          disabled={isLoading}
          style={[styles.refreshButton, { opacity: isLoading ? 0.7 : 1 }]}
          accessibilityLabel={insights.generateButton}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <RefreshCw size={18} color={theme.colors.primary} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow]}>
          <View style={styles.loadingRow}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>{t.common.processing}</Text>
          </View>
        </View>
      )}

      {error && !isLoading && (
        <View style={[styles.card, styles.errorCard, { backgroundColor: theme.colors.surface }, cardShadow]}>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
        </View>
      )}

      {data && !isLoading && (
        <ScrollView style={styles.insightsScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <View style={styles.grid}>
            <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }, cardShadow]}>
              <View style={styles.cardTitleRow}>
                <BarChart2 size={16} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{insights.summaryTitle}</Text>
              </View>
              <Text style={[styles.insightText, { color: theme.colors.textSecondary }]}>{data.summary}</Text>
            </View>

            {data.anomalies && data.anomalies.length > 0 && (
              <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }, cardShadow]}>
                <View style={styles.cardTitleRow}>
                  <AlertTriangle size={16} color={theme.colors.warning ?? '#f59e0b'} />
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{insights.anomaliesTitle}</Text>
                </View>
                <View style={styles.anomalyList}>
                  {data.anomalies.map((anomaly) => (
                    <Text key={anomaly} style={[styles.anomalyItem, { color: theme.colors.textSecondary }]}>
                      • {anomaly}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }, cardShadow]}>
              <View style={styles.cardTitleRow}>
                <Eye size={16} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{insights.ghostExpensesTitle}</Text>
              </View>
              {data.ghostExpenses && data.ghostExpenses.length > 0 ? (
                <View style={styles.ghostList}>
                  {data.ghostExpenses.map((ghost) => (
                    <View key={ghost.description} style={[styles.ghostItem, { borderBottomColor: theme.colors.gray300 }]}>
                      <View style={styles.ghostHeader}>
                        <Text style={[styles.ghostName, { color: theme.colors.textPrimary }]}>{ghost.description}</Text>
                        <Text style={[styles.ghostAmount, { color: theme.colors.textPrimary }]}>
                          {formatCurrency(ghost.amount, locale)}
                        </Text>
                      </View>
                      <Text style={[styles.ghostMeta, { color: theme.colors.textSecondary }]}>
                        {insights.ghostMonths.replace('{months}', String(ghost.monthsRepeated))}
                      </Text>
                      <Text style={[styles.ghostSuggestion, { color: theme.colors.textSecondary }]}>
                        {ghost.suggestion}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.ghostEmpty}>
                  <CheckCircle size={14} color={theme.colors.success} />
                  <Text style={[styles.ghostEmptyText, { color: theme.colors.textSecondary }]}>
                    {insights.ghostExpensesEmpty}
                  </Text>
                </View>
              )}
            </View>

            {data.cashFlowForecast && (
              <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }, cardShadow]}>
                <View style={styles.cardTitleRow}>
                  <DollarSign size={16} color={theme.colors.primary} />
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{insights.cashFlowTitle}</Text>
                </View>
                <View style={styles.forecastGrid}>
                  <View style={styles.forecastRow}>
                    <Text style={[styles.forecastLabel, { color: theme.colors.textSecondary }]}>
                      {insights.cashFlowEndOfMonth}
                    </Text>
                    <Text
                      style={[
                        styles.forecastValue,
                        { color: data.cashFlowForecast.endOfMonth >= 0 ? theme.colors.success : theme.colors.danger },
                      ]}
                    >
                      {formatCurrency(data.cashFlowForecast.endOfMonth, locale)}
                    </Text>
                  </View>
                  <View style={styles.forecastRow}>
                    <Text style={[styles.forecastLabel, { color: theme.colors.textSecondary }]}>
                      {insights.cashFlowNext90Days}
                    </Text>
                    <Text
                      style={[
                        styles.forecastValue,
                        { color: data.cashFlowForecast.next90Days >= 0 ? theme.colors.success : theme.colors.danger },
                      ]}
                    >
                      {formatCurrency(data.cashFlowForecast.next90Days, locale)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.forecastNote, { color: theme.colors.textSecondary }]}>
                  <Text style={styles.forecastNoteBold}>{insights.cashFlowInstallment}:</Text>{' '}
                  {data.cashFlowForecast.canAffordInstallment}
                </Text>
              </View>
            )}

            {data.categoryBreakdowns && data.categoryBreakdowns.length > 0 && (
              <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }, cardShadow]}>
                <View style={styles.cardTitleRow}>
                  <TrendingUp size={16} color={theme.colors.primary} />
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                    {insights.categoryComparisonTitle}
                  </Text>
                </View>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: theme.colors.gray300 }]}>
                    <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>
                      {insights.tableCategory}
                    </Text>
                    <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>
                      {insights.tableCurrentMonth}
                    </Text>
                    <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>
                      {insights.tablePreviousAvg}
                    </Text>
                    <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>
                      {insights.tableChange}
                    </Text>
                  </View>
                  {data.categoryBreakdowns.map((cat) => (
                    <View key={cat.category} style={[styles.tableRow, { borderBottomColor: theme.colors.gray300 }]}>
                      <Text style={[styles.tableCell, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {cat.category}
                      </Text>
                      <Text style={[styles.tableCell, { color: theme.colors.textPrimary }]}>
                        {cat.currentMonth.toFixed(2)}
                      </Text>
                      <Text style={[styles.tableCell, { color: theme.colors.textPrimary }]}>
                        {cat.previousAverage.toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.percentBadge,
                          { color: cat.percentChange <= 0 ? theme.colors.success : theme.colors.danger },
                        ]}
                      >
                        {cat.percentChange > 0 ? '+' : ''}{cat.percentChange.toFixed(1)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }, cardShadow]}>
              <View style={styles.cardTitleRow}>
                <Target size={16} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  {insights.savingsProjectionTitle}
                </Text>
              </View>
              <Text style={[styles.insightText, { color: theme.colors.textSecondary }]}>{data.savingsProjection}</Text>
            </View>

            <View
              style={[
                styles.insightCard,
                styles.motivationalCard,
                { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary },
                cardShadow,
              ]}
            >
              <View style={styles.cardTitleRow}>
                <Zap size={16} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{insights.motivationalTitle}</Text>
              </View>
              <Text style={[styles.motivationalText, { color: theme.colors.textPrimary }]}>
                {data.motivationalTip}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 8,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  refreshButton: {
    padding: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  errorCard: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  errorText: {
    fontSize: 14,
  },
  insightsScroll: {
    maxHeight: 600,
  },
  grid: {
    gap: 12,
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  anomalyList: {
    gap: 6,
  },
  anomalyItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  ghostList: {
    gap: 0,
  },
  ghostItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ghostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ghostName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  ghostAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  ghostMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  ghostSuggestion: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  ghostEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ghostEmptyText: {
    fontSize: 14,
  },
  forecastGrid: {
    gap: 8,
    marginBottom: 10,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: 13,
  },
  forecastValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  forecastNote: {
    fontSize: 13,
    lineHeight: 18,
  },
  forecastNoteBold: {
    fontWeight: '600',
  },
  table: {},
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeader: {
    paddingBottom: 6,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
  },
  percentBadge: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  motivationalCard: {
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  motivationalText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
});
