import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
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
import { useThemeContext } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useDateFormat } from '../contexts/DateFormatContext';
import { createTransaction, type ApiCategory } from '../services/api';

interface AddTransactionModalProps {
  visible: boolean;
  categories: ApiCategory[];
  currencyCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTransactionModal({
  visible,
  categories,
  currencyCode,
  onClose,
  onSuccess,
}: AddTransactionModalProps) {
  const { theme } = useThemeContext();
  const { t, locale } = useTranslation();
  const { formatDate } = useDateFormat();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const parseISODate = (str: string): Date => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const toISODate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const displayDate = (str: string): string => formatDate(`${str}T00:00:00.000Z`, locale);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0]._id);
    }
  }, [visible, categories, categoryId]);

  const reset = () => {
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setType('expense');
    setCategoryId(categories[0]?._id ?? '');
    setIsFixed(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!description.trim()) {
      setError('Description required');
      return;
    }
    const numAmount = Number.parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setError('Invalid amount');
      return;
    }
    if (!categoryId) {
      setError('Category required');
      return;
    }
    setSubmitting(true);
    try {
      await createTransaction({
        description: description.trim(),
        amount: numAmount,
        currency: currencyCode,
        date: new Date(date).toISOString(),
        type,
        category: categoryId,
        is_fixed: isFixed,
      });
      reset();
      onClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.box, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.gray300 }]}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t.transactionForm.addTitle}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>{t.transactionForm.cancel}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.description}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.gray300 }]}
              value={description}
              onChangeText={setDescription}
              placeholder={t.transactionForm.descriptionPlaceholder}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.amount}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.gray300 }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.date}</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.gray300 }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontSize: 16 }}>
                {displayDate(date)}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={parseISODate(date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowDatePicker(false);
                  if (_event.type === 'set' && selectedDate) {
                    setDate(toISODate(selectedDate));
                  }
                }}
              />
            )}
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.type}</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && { backgroundColor: theme.colors.success }]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeBtnText, { color: type === 'income' ? '#fff' : theme.colors.textPrimary }]}>{t.transactions.income}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && { backgroundColor: theme.colors.danger }]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeBtnText, { color: type === 'expense' ? '#fff' : theme.colors.textPrimary }]}>{t.transactions.expense}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.category}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.chip, categoryId === c._id && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setCategoryId(c._id)}
                >
                  <Text style={[styles.chipText, { color: categoryId === c._id ? '#fff' : theme.colors.textPrimary }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.fixedRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.fixedTransaction}</Text>
              <Switch value={isFixed} onValueChange={setIsFixed} trackColor={{ false: theme.colors.gray300, true: theme.colors.primary }} thumbColor="#fff" />
            </View>
            {error && <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>}
          </ScrollView>
          <View style={[styles.footer, { borderTopColor: theme.colors.gray300 }]}>
            <TouchableOpacity style={[styles.footerBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.footerBtnTextWhite}>{submitting ? t.transactionForm.adding : t.transactionForm.addButton}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerBtn, { borderColor: theme.colors.gray300 }]} onPress={handleClose}>
              <Text style={[styles.footerBtnText, { color: theme.colors.textPrimary }]}>{t.transactionForm.cancel}</Text>
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
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeBtnText: {
    fontSize: 15,
    fontWeight: '600',
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
  fixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
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
