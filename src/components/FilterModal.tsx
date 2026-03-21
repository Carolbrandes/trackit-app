import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDateFormat } from '../contexts/DateFormatContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useThemeContext } from '../contexts/ThemeContext';
import type { ApiCategory, TransactionFilters } from '../services/api';

interface FilterModalProps {
  visible: boolean;
  filters: TransactionFilters;
  categories: ApiCategory[];
  onApply: (filters: TransactionFilters) => void;
  onClose: () => void;
  onReset: () => void;
}

export function FilterModal({
  visible,
  filters,
  categories,
  onApply,
  onClose,
  onReset,
}: FilterModalProps) {
  const { theme } = useThemeContext();
  const { t, locale } = useTranslation();
  const { formatDate } = useDateFormat();

  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);

  const parseISODate = (str: string): Date => {
    if (str) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  };

  const toISODate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const displayDate = (str: string): string => {
    if (!str) return '';
    return formatDate(`${str}T00:00:00.000Z`, locale);
  };

  const [description, setDescription] = React.useState(filters.description ?? '');
  const [category, setCategory] = React.useState(filters.category ?? '');
  const [type, setType] = React.useState(filters.type ?? '');
  const [startDate, setStartDate] = React.useState(filters.startDate ?? '');
  const [endDate, setEndDate] = React.useState(filters.endDate ?? '');
  const [minAmount, setMinAmount] = React.useState(filters.minAmount ?? '');
  const [maxAmount, setMaxAmount] = React.useState(filters.maxAmount ?? '');
  const [fixedOnly, setFixedOnly] = React.useState(!!filters.fixedOnly);

  React.useEffect(() => {
    if (visible) {
      setDescription(filters.description ?? '');
      setCategory(filters.category ?? '');
      setType(filters.type ?? '');
      setStartDate(filters.startDate ?? '');
      setEndDate(filters.endDate ?? '');
      setMinAmount(filters.minAmount ?? '');
      setMaxAmount(filters.maxAmount ?? '');
      setFixedOnly(!!filters.fixedOnly);
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApply({
      ...(description.trim() && { description: description.trim() }),
      ...(category && { category }),
      ...(type && { type: type as 'income' | 'expense' }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(minAmount && { minAmount }),
      ...(maxAmount && { maxAmount }),
      ...(fixedOnly && { fixedOnly: true }),
    });
    onClose();
  };

  const handleReset = () => {
    onReset();
    setDescription('');
    setCategory('');
    setType('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setFixedOnly(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.box, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.gray300 }]}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t.filter.title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>{t.transactionForm.cancel}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.filter.description}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.gray300 }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t.filter.description}
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.filter.allCategories}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, !category && { backgroundColor: theme.colors.primary }]}
                onPress={() => setCategory('')}
              >
                <Text style={[styles.chipText, { color: !category ? '#fff' : theme.colors.textPrimary }]}>{t.filter.allCategories}</Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.chip, category === c._id && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setCategory(c._id)}
                >
                  <Text style={[styles.chipText, { color: category === c._id ? '#fff' : theme.colors.textPrimary }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.filter.allTypes}</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, type === '' && { backgroundColor: theme.colors.primary }]}
                onPress={() => setType('')}
              >
                <Text style={[styles.typeBtnText, { color: type === '' ? '#fff' : theme.colors.textPrimary }]}>{t.filter.allTypes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && { backgroundColor: theme.colors.success }]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeBtnText, { color: type === 'income' ? '#fff' : theme.colors.textPrimary }]}>{t.filter.income}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && { backgroundColor: theme.colors.danger }]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeBtnText, { color: type === 'expense' ? '#fff' : theme.colors.textPrimary }]}>{t.filter.expense}</Text>
              </TouchableOpacity>
            </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.filter.startDate}</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.gray300 }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={{ color: startDate ? theme.colors.textPrimary : theme.colors.textSecondary, fontSize: 16 }}>
                {startDate ? displayDate(startDate) : t.filter.startDate}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={parseISODate(startDate)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowStartPicker(false);
                  if (_event.type === 'set' && selectedDate) {
                    setStartDate(toISODate(selectedDate));
                  }
                }}
              />
            )}
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.filter.endDate}</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.gray300 }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={{ color: endDate ? theme.colors.textPrimary : theme.colors.textSecondary, fontSize: 16 }}>
                {endDate ? displayDate(endDate) : t.filter.endDate}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={parseISODate(endDate)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowEndPicker(false);
                  if (_event.type === 'set' && selectedDate) {
                    setEndDate(toISODate(selectedDate));
                  }
                }}
              />
            )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.filter.minAmount}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.gray300 }]}
                value={minAmount}
                onChangeText={setMinAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.filter.maxAmount}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.gray300 }]}
                value={maxAmount}
                onChangeText={setMaxAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.fixedRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.filter.fixedOnly}</Text>
              <Switch value={fixedOnly} onValueChange={setFixedOnly} trackColor={{ false: theme.colors.gray300, true: theme.colors.primary }} thumbColor="#fff" />
            </View>
          </ScrollView>
          <View style={[styles.footer, { borderTopColor: theme.colors.gray300 }]}>
            <TouchableOpacity style={[styles.footerBtn, { backgroundColor: theme.colors.primary }]} onPress={handleApply}>
              <Text style={styles.footerBtnTextWhite}>{t.editModal.save}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerBtn, { borderColor: theme.colors.gray300 }]} onPress={handleReset}>
              <Text style={[styles.footerBtnText, { color: theme.colors.textPrimary }]}>{t.filter.resetFilters}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  box: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    maxHeight: 400,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 24,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chipRow: {
    marginVertical: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  footerBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerBtnTextWhite: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
