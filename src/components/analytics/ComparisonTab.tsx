import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTransactions, type Transaction } from '../../hooks/useTransactions';
import type { Translations } from '../../i18n/locales';
import type { Theme } from '../../styles/theme';

const CHART_COLOR_A = '#6366f1';
const CHART_COLOR_B = '#f59e0b';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 64;

function getCategoryName(txn: Transaction): string {
  if (typeof txn.category === 'object' && txn.category !== null && 'name' in txn.category) {
    return (txn.category as { name: string }).name;
  }
  return 'N/A';
}

function groupExpensesByCategory(transactions: Transaction[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const tx of transactions.filter((t) => t.type === 'expense')) {
    const name = getCategoryName(tx);
    map.set(name, (map.get(name) || 0) + tx.amount);
  }
  return map;
}

function MonthPickerModal({
  visible,
  months,
  years,
  selectedMonth,
  selectedYear,
  onSelect,
  onClose,
  theme,
  label,
}: {
  visible: boolean;
  months: { value: number; name: string }[];
  years: number[];
  selectedMonth: number;
  selectedYear: number;
  onSelect: (month: number, year: number) => void;
  onClose: () => void;
  theme: Theme;
  label: string;
}) {
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);

  const handleConfirm = () => {
    onSelect(tempMonth, tempYear);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.pickerOverlay}>
        <View style={[styles.pickerBox, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.pickerTitle, { color: theme.colors.textPrimary }]}>{label}</Text>

          <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>
            {months.find((m) => m.value === tempMonth)?.name ?? ''} {tempYear}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {months.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[styles.chip, tempMonth === m.value && { backgroundColor: theme.colors.primary }]}
                onPress={() => setTempMonth(m.value)}
              >
                <Text style={[styles.chipText, { color: tempMonth === m.value ? '#fff' : theme.colors.textPrimary }]}>
                  {m.name.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {years.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.chip, tempYear === y && { backgroundColor: theme.colors.primary }]}
                onPress={() => setTempYear(y)}
              >
                <Text style={[styles.chipText, { color: tempYear === y ? '#fff' : theme.colors.textPrimary }]}>
                  {y}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.pickerActions}>
            <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: theme.colors.primary }]} onPress={handleConfirm}>
              <Text style={styles.pickerBtnText}>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickerBtn, { borderWidth: 1, borderColor: theme.colors.gray300 }]} onPress={onClose}>
              <Text style={[styles.pickerBtnTextSecondary, { color: theme.colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface ComparisonTabProps {
  userId: string | undefined;
  theme: Theme;
  t: Translations;
  locale: string;
  currencyCode: string;
  formatCurrency: (amount: number, currencyCode: string, locale: string) => string;
}

export function ComparisonTab({
  userId,
  theme,
  t,
  locale,
  currencyCode,
  formatCurrency,
}: ComparisonTabProps) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const [monthA, setMonthA] = useState(prevMonth);
  const [yearA, setYearA] = useState(prevYear);
  const [monthB, setMonthB] = useState(currentMonth);
  const [yearB, setYearB] = useState(currentYear);
  const [pickerTarget, setPickerTarget] = useState<'A' | 'B' | null>(null);

  const months = t.analytics.months.map((name, i) => ({ value: i + 1, name }));
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const pad = (n: number) => String(n).padStart(2, '0');

  const filtersA = useMemo(() => ({
    startDate: `${yearA}-${pad(monthA)}-01`,
    endDate: `${yearA}-${pad(monthA)}-${pad(new Date(yearA, monthA, 0).getDate())}`,
  }), [monthA, yearA]);

  const filtersB = useMemo(() => ({
    startDate: `${yearB}-${pad(monthB)}-01`,
    endDate: `${yearB}-${pad(monthB)}-${pad(new Date(yearB, monthB, 0).getDate())}`,
  }), [monthB, yearB]);

  const { allTransactions: txnsA } = useTransactions(userId, 1, 9999, filtersA);
  const { allTransactions: txnsB } = useTransactions(userId, 1, 9999, filtersB);

  const mapA = useMemo(() => groupExpensesByCategory(txnsA), [txnsA]);
  const mapB = useMemo(() => groupExpensesByCategory(txnsB), [txnsB]);

  const allCategories = useMemo(() => {
    return Array.from(new Set([...mapA.keys(), ...mapB.keys()])).sort((a, b) => {
      const totalA = (mapA.get(a) || 0) + (mapB.get(a) || 0);
      const totalB = (mapA.get(b) || 0) + (mapB.get(b) || 0);
      return totalB - totalA;
    });
  }, [mapA, mapB]);

  const labelA = `${months.find((m) => m.value === monthA)?.name.slice(0, 3) ?? monthA}/${yearA}`;
  const labelB = `${months.find((m) => m.value === monthB)?.name.slice(0, 3) ?? monthB}/${yearB}`;

  const groupedBarData = useMemo(() => {
    return allCategories.flatMap((cat) => [
      {
        value: mapA.get(cat) ?? 0,
        label: cat.length > 8 ? `${cat.slice(0, 7)}…` : cat,
        frontColor: CHART_COLOR_A,
        spacing: 2,
      },
      {
        value: mapB.get(cat) ?? 0,
        frontColor: CHART_COLOR_B,
        spacing: 24,
      },
    ]);
  }, [allCategories, mapA, mapB]);

  const handlePickerSelect = useCallback(
    (month: number, year: number) => {
      if (pickerTarget === 'A') {
        setMonthA(month);
        setYearA(year);
      } else {
        setMonthB(month);
        setYearB(year);
      }
    },
    [pickerTarget]
  );

  const isEmpty = allCategories.length === 0;

  return (
    <>
      <View style={styles.selectorRow}>
        <TouchableOpacity
          style={[styles.selectorBtn, { backgroundColor: theme.colors.surface, borderColor: CHART_COLOR_A }]}
          onPress={() => setPickerTarget('A')}
        >
          <Text style={[styles.selectorLabel, { color: theme.colors.textSecondary }]}>{t.analytics.monthA}</Text>
          <Text style={[styles.selectorValue, { color: theme.colors.textPrimary }]}>{labelA}</Text>
        </TouchableOpacity>

        <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>vs</Text>

        <TouchableOpacity
          style={[styles.selectorBtn, { backgroundColor: theme.colors.surface, borderColor: CHART_COLOR_B }]}
          onPress={() => setPickerTarget('B')}
        >
          <Text style={[styles.selectorLabel, { color: theme.colors.textSecondary }]}>{t.analytics.monthB}</Text>
          <Text style={[styles.selectorValue, { color: theme.colors.textPrimary }]}>{labelB}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: CHART_COLOR_A }]} />
          <Text style={[styles.legendLabel, { color: theme.colors.textPrimary }]}>{labelA}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: CHART_COLOR_B }]} />
          <Text style={[styles.legendLabel, { color: theme.colors.textPrimary }]}>{labelB}</Text>
        </View>
      </View>

      {isEmpty ? (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t.analytics.noDataForPeriod}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.textPrimary }]}>{t.analytics.comparisonChart}</Text>
            <View style={styles.barContainer}>
              <BarChart
                data={groupedBarData}
                barWidth={16}
                spacing={2}
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                noOfSections={4}
                maxValue={Math.max(...groupedBarData.map((d) => d.value), 1) * 1.15}
                width={chartWidth}
                containerHeight={Math.max(180, allCategories.length * 50)}
                showFractionalValues={false}
              />
            </View>
          </View>

          <View style={[styles.tableCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
            <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: theme.colors.gray300 }]}>
              <Text style={[styles.tableHeaderText, styles.tableCellCat, { color: theme.colors.textSecondary }]}>
                {t.analytics.tableCategory}
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableCellVal, { color: CHART_COLOR_A }]}>{labelA}</Text>
              <Text style={[styles.tableHeaderText, styles.tableCellVal, { color: CHART_COLOR_B }]}>{labelB}</Text>
              <Text style={[styles.tableHeaderText, styles.tableCellVar, { color: theme.colors.textSecondary }]}>
                {t.analytics.tableVariation}
              </Text>
            </View>

            {allCategories.map((cat) => {
              const valA = mapA.get(cat) ?? 0;
              const valB = mapB.get(cat) ?? 0;
              let diff = 0;
              if (valA > 0) diff = ((valB - valA) / valA) * 100;
              else if (valB > 0) diff = 100;

              let icon = '—';
              let diffColor = theme.colors.textSecondary;
              if (diff > 0.5) { icon = '▲'; diffColor = theme.colors.danger; }
              else if (diff < -0.5) { icon = '▼'; diffColor = theme.colors.success; }

              return (
                <View key={cat} style={[styles.tableRow, { borderBottomColor: theme.colors.gray300 }]}>
                  <Text style={[styles.tableCell, styles.tableCellCat, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {cat}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellVal, { color: theme.colors.textPrimary }]}>
                    {formatCurrency(valA, currencyCode, locale)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellVal, { color: theme.colors.textPrimary }]}>
                    {formatCurrency(valB, currencyCode, locale)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellVar, { color: diffColor, fontWeight: '600' }]}>
                    {icon} {Math.abs(diff).toFixed(1)}%
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      <MonthPickerModal
        visible={pickerTarget !== null}
        months={months}
        years={years}
        selectedMonth={pickerTarget === 'A' ? monthA : monthB}
        selectedYear={pickerTarget === 'A' ? yearA : yearB}
        onSelect={handlePickerSelect}
        onClose={() => setPickerTarget(null)}
        theme={theme}
        label={pickerTarget === 'A' ? t.analytics.monthA : t.analytics.monthB}
      />
    </>
  );
}

const styles = StyleSheet.create({
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  selectorBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '500',
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
  barContainer: {
    overflow: 'hidden',
  },
  tableCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeader: {
    paddingBottom: 6,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tableCell: {
    fontSize: 12,
  },
  tableCellCat: {
    flex: 2,
    paddingRight: 4,
  },
  tableCellVal: {
    flex: 2,
    textAlign: 'right',
    paddingHorizontal: 2,
  },
  tableCellVar: {
    flex: 1.5,
    textAlign: 'right',
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerBox: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  chipScroll: {
    maxHeight: 44,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  pickerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickerBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  pickerBtnTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
  },
});
