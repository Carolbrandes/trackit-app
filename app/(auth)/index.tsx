import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Plus, Filter, Pencil, Trash2, Check, Download } from 'lucide-react-native';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { useTranslation } from '../../src/contexts/LanguageContext';
import { useUserData } from '../../src/hooks/useUserData';
import { useTransactions, type Transaction } from '../../src/hooks/useTransactions';
import { useCurrency } from '../../src/hooks/useCurrency';
import { formatCurrency } from '../../src/utils/formatters';
import { useDateFormat, type DateFormatPreference } from '../../src/contexts/DateFormatContext';
import { deleteTransaction, updateTransaction, createTransaction, fetchCategories, createCategory, type ApiCategory, type UpdateTransactionPayload, type TransactionFilters } from '../../src/services/api';
import { ExpandableCard, type ExpandableCardData } from '../../src/components/ExpandableCard';
import { FilterModal } from '../../src/components/FilterModal';
import { AddTransactionModal } from '../../src/components/AddTransactionModal';
import { ReceiptScannerModal } from '../../src/components/ReceiptScannerModal';
import { useCategorySeeding } from '../../src/hooks/useCategorySeeding';
import { exportToCSV, exportToXML, exportToPDF } from '../../src/utils/exportData';

const PAGE_SIZE = 10;

function getCategoryName(txn: Transaction): string {
  if (typeof txn.category === 'object' && txn.category !== null && 'name' in txn.category) {
    return txn.category.name;
  }
  return '';
}

function getCategoryId(txn: Transaction): string {
  if (typeof txn.category === 'object' && txn.category !== null && '_id' in txn.category) {
    return txn.category._id;
  }
  return typeof txn.category === 'string' ? txn.category : '';
}

function SummaryCard({
  transactions,
  totalCount,
  currencyCode,
  locale,
  theme,
  t,
}: {
  transactions: Transaction[];
  totalCount: number;
  currencyCode: string;
  locale: string;
  theme: ReturnType<typeof useThemeContext>['theme'];
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.type === 'income') acc.income += tx.amount;
        else acc.expense += tx.amount;
        acc.balance = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, balance: 0 }
    );
  }, [transactions]);

  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: theme.colors.textPrimary }]}>{t.summary.income}</Text>
        <Text style={[styles.summaryValuePositive, { color: theme.colors.success }]}>
          {formatCurrency(totals.income, currencyCode, locale)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: theme.colors.textPrimary }]}>{t.summary.expense}</Text>
        <Text style={[styles.summaryValueNegative, { color: theme.colors.danger }]}>
          {formatCurrency(totals.expense, currencyCode, locale)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: theme.colors.textPrimary }]}>{t.summary.balance}</Text>
        <Text
          style={[
            styles.summaryValueBalance,
            { color: totals.balance >= 0 ? theme.colors.success : theme.colors.danger },
          ]}
        >
          {formatCurrency(totals.balance, currencyCode, locale)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: theme.colors.textPrimary }]}>{t.summary.transactionCount}</Text>
        <Text style={[styles.summaryCount, { color: theme.colors.textPrimary }]}>{totalCount}</Text>
      </View>
    </View>
  );
}

function TransactionDetailModal({
  visible,
  transaction,
  currencyCode,
  locale,
  theme,
  t,
  onClose,
  onDeleted,
  onUpdated,
}: {
  visible: boolean;
  transaction: Transaction | null;
  currencyCode: string;
  locale: string;
  theme: ReturnType<typeof useThemeContext>['theme'];
  t: ReturnType<typeof useTranslation>['t'];
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const { formatDate } = useDateFormat();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editFixed, setEditFixed] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const parseISODate = (str: string): Date => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
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

  const txDateToISO = (date: Transaction['date']): string => {
    if (!date) return toISODate(new Date());
    const str = String(date);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    return toISODate(new Date(str));
  };

  const resetForm = useCallback(() => {
    if (transaction) {
      setEditDesc(transaction.description);
      setEditAmount(String(transaction.amount));
      setEditDate(txDateToISO(transaction.date));
      setEditType(transaction.type);
      setEditCategoryId(getCategoryId(transaction));
      setEditFixed(!!transaction.is_fixed);
    }
    setMode('view');
  }, [transaction]);

  const openEdit = useCallback(() => {
    if (!transaction) return;
    setEditDesc(transaction.description);
    setEditAmount(String(transaction.amount));
    setEditDate(txDateToISO(transaction.date));
    setEditType(transaction.type);
    setEditCategoryId(getCategoryId(transaction));
    setEditFixed(!!transaction.is_fixed);
    setMode('edit');
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, [transaction]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSave = useCallback(async () => {
    if (!transaction || !editDesc.trim() || !editAmount.trim()) return;
    const amount = Number.parseFloat(editAmount.replace(',', '.'));
    if (Number.isNaN(amount) || amount <= 0) return;
    if (!editCategoryId) return;
    setSaving(true);
    try {
      const payload: UpdateTransactionPayload = {
        description: editDesc.trim(),
        amount,
        currency: transaction.currency,
        type: editType,
        category: editCategoryId,
        is_fixed: editFixed,
        date: editDate || undefined,
      };
      await updateTransaction(transaction._id, payload);
      onUpdated();
      resetForm();
      onClose();
    } catch (err) {
      Alert.alert(t.transactions.title, err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }, [transaction, editDesc, editAmount, editType, editCategoryId, editFixed, onUpdated, onClose, resetForm, t.transactions.title]);

  const handleDelete = useCallback(() => {
    if (!transaction) return;
    Alert.alert(
      t.transactions.delete,
      t.transactions.confirmDelete,
      [
        { text: t.transactionForm.cancel, style: 'cancel' },
        {
          text: t.transactions.delete,
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteTransaction(transaction._id);
              onDeleted();
              handleClose();
            } catch (err) {
              Alert.alert(t.transactions.title, err instanceof Error ? err.message : 'Error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [transaction, t, onDeleted, handleClose]);

  if (!transaction) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalBox, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.gray300 }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              {mode === 'view' ? t.transactions.title : t.transactions.edit}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Text style={[styles.modalClose, { color: theme.colors.primary }]}>{t.transactionForm.cancel}</Text>
            </TouchableOpacity>
          </View>

          {mode === 'view' ? (
            <>
              <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.description}</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>{transaction.description}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.date}</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>{formatDate(String(transaction.date), locale)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.category}</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>{getCategoryName(transaction) || t.transactions.uncategorized}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.type}</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>{transaction.type === 'income' ? t.transactions.income : t.transactions.expense}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.amount}</Text>
                  <Text style={[styles.detailValue, transaction.type === 'income' ? { color: theme.colors.success } : { color: theme.colors.danger }, styles.detailAmount]}>
                    {formatCurrency(transaction.amount, currencyCode, locale)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.fixed}</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>{transaction.is_fixed ? 'Sim' : 'Não'}</Text>
                </View>
              </ScrollView>
              <View style={[styles.modalActions, { borderTopColor: theme.colors.gray300 }]}>
                <TouchableOpacity style={[styles.actionButton, { borderColor: theme.colors.primary }]} onPress={openEdit} disabled={loading}>
                  <Pencil size={18} color={theme.colors.primary} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>{t.transactions.edit}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButtonDanger, { borderColor: theme.colors.danger }]} onPress={handleDelete} disabled={loading}>
                  <Trash2 size={18} color={theme.colors.danger} />
                  <Text style={[styles.actionButtonTextDanger, { color: theme.colors.danger }]}>{t.transactions.delete}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.description}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.gray300 }]}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder={t.transactionForm.descriptionPlaceholder}
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.amount}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.gray300 }]}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.date}</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.gray300 }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 16 }}>
                    {editDate ? displayDate(editDate) : ''}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={parseISODate(editDate)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
                      setShowDatePicker(false);
                      if (_event.type === 'set' && selectedDate) {
                        setEditDate(toISODate(selectedDate));
                      }
                    }}
                  />
                )}
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.type}</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeButton, editType === 'income' && { backgroundColor: theme.colors.success }]}
                    onPress={() => setEditType('income')}
                  >
                    <Text style={[styles.typeButtonText, { color: editType === 'income' ? '#fff' : theme.colors.textPrimary }]}>{t.transactions.income}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, editType === 'expense' && { backgroundColor: theme.colors.danger }]}
                    onPress={() => setEditType('expense')}
                  >
                    <Text style={[styles.typeButtonText, { color: editType === 'expense' ? '#fff' : theme.colors.textPrimary }]}>{t.transactions.expense}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.category}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[
                        styles.categoryChip,
                        editCategoryId === cat._id ? { backgroundColor: theme.colors.primary } : { borderWidth: 1, borderColor: theme.colors.gray300 },
                      ]}
                      onPress={() => setEditCategoryId(cat._id)}
                    >
                      <Text style={[styles.categoryChipText, { color: editCategoryId === cat._id ? '#fff' : theme.colors.textPrimary }]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={[styles.detailRow, styles.fixedRow]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.fixed}</Text>
                  <Switch value={editFixed} onValueChange={setEditFixed} trackColor={{ false: theme.colors.gray300, true: theme.colors.primary }} thumbColor="#fff" />
                </View>
              </ScrollView>
              <View style={[styles.modalActions, { borderTopColor: theme.colors.gray300 }]}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} onPress={handleSave} disabled={saving}>
                  <Text style={[styles.actionButtonText, { color: '#fff' }]}>{t.editModal.save}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { borderColor: theme.colors.gray300 }]} onPress={resetForm}>
                  <Text style={[styles.actionButtonText, { color: theme.colors.textPrimary }]}>{t.transactionForm.cancel}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const DATE_FORMAT_OPTIONS: DateFormatPreference[] = ['mm/dd/yyyy', 'dd/mm/yyyy', 'long'];
const DATE_FORMAT_LABELS: Record<DateFormatPreference, string> = {
  'mm/dd/yyyy': 'MM/DD/YYYY',
  'dd/mm/yyyy': 'DD/MM/YYYY',
  long: '1 Jan 2026',
};

export default function TransactionsScreen() {
  const { theme } = useThemeContext();
  const { t, locale } = useTranslation();
  const { user, isLoading: userLoading } = useUserData();
  const { selectedCurrencyCode } = useCurrency();
  const { dateFormat, setDateFormat, formatDate } = useDateFormat();

  const [page, setPage] = useState(1);
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const defaultFilters: TransactionFilters = {
    startDate: new Date(year, month - 1, 1).toISOString().slice(0, 10),
    endDate: new Date(year, month, 0).toISOString().slice(0, 10),
  };
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('thisMonth');

  const {
    transactions,
    allTransactions,
    totalCount,
    totalPages,
    isLoading: txLoading,
    error: txError,
    refetch,
  } = useTransactions(user?._id, page, PAGE_SIZE, filters);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  // Bulk delete state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const reloadCategories = useCallback(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?._id) reloadCategories();
  }, [user?._id, reloadCategories]);

  // Auto-seed default categories for new users
  useCategorySeeding(user?._id, reloadCategories);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const openEdit = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setEditModalVisible(true);
  };
  const closeEdit = () => {
    setEditModalVisible(false);
    setSelectedTransaction(null);
  };

  const handleScan = () => {
    setScanModalVisible(true);
  };

  const handleSaveScanTransactions = async (
    transactions: Array<{
      description: string;
      amount: number;
      currency: string;
      date: Date;
      type: 'expense' | 'income';
      is_fixed: boolean;
      category: string;
    }>
  ) => {
    for (const tx of transactions) {
      await createTransaction({
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency,
        date: tx.date.toISOString(),
        type: tx.type,
        is_fixed: tx.is_fixed,
        category: tx.category,
      });
    }
    refetch();
  };
  const handleAddTransaction = () => {
    setAddModalVisible(true);
  };
  const handleFilter = () => {
    setFilterModalVisible(true);
  };

  // ── Bulk delete ──────────────────────────────────────────────────────────────

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    const msg = t.bulkDelete.confirmDeleteSelected.replace('{count}', String(selectedIds.size));
    Alert.alert(t.bulkDelete.deleteSelected, msg, [
      { text: t.transactionForm.cancel, style: 'cancel' },
      {
        text: t.transactions.delete,
        style: 'destructive',
        onPress: async () => {
          setIsBulkDeleting(true);
          try {
            await Promise.all([...selectedIds].map((id) => deleteTransaction(id)));
            exitSelectionMode();
            refetch();
          } catch {
            Alert.alert('Error', 'Some transactions could not be deleted.');
          } finally {
            setIsBulkDeleting(false);
          }
        },
      },
    ]);
  }, [selectedIds, t, exitSelectionMode, refetch]);

  const handleDeleteAll = useCallback(() => {
    Alert.alert(t.bulkDelete.deleteAll, t.bulkDelete.confirmDeleteAll, [
      { text: t.transactionForm.cancel, style: 'cancel' },
      {
        text: t.transactions.delete,
        style: 'destructive',
        onPress: async () => {
          setIsBulkDeleting(true);
          try {
            await Promise.all(allTransactions.map((tx) => deleteTransaction(tx._id)));
            exitSelectionMode();
            refetch();
          } catch {
            Alert.alert('Error', 'Some transactions could not be deleted.');
          } finally {
            setIsBulkDeleting(false);
          }
        },
      },
    ]);
  }, [allTransactions, t, exitSelectionMode, refetch]);

  // ── Export ───────────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    if (allTransactions.length === 0) return;
    const filename = `transactions_${new Date().toISOString().slice(0, 10)}`;
    Alert.alert(t.export.title, 'Choose format:', [
      { text: t.transactionForm.cancel, style: 'cancel' },
      {
        text: t.export.csv,
        onPress: async () => {
          setIsExporting(true);
          try { await exportToCSV(allTransactions, filename); }
          catch { Alert.alert('Error', t.export.error); }
          finally { setIsExporting(false); }
        },
      },
      {
        text: t.export.xml,
        onPress: async () => {
          setIsExporting(true);
          try { await exportToXML(allTransactions, filename); }
          catch { Alert.alert('Error', t.export.error); }
          finally { setIsExporting(false); }
        },
      },
      {
        text: t.export.pdf,
        onPress: async () => {
          setIsExporting(true);
          try { await exportToPDF(allTransactions, filename); }
          catch { Alert.alert('Error', t.export.error); }
          finally { setIsExporting(false); }
        },
      },
    ]);
  }, [allTransactions, t]);

  const handleFilterReset = () => {
    const d = new Date();
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    setFilters({
      startDate: new Date(y, m - 1, 1).toISOString().slice(0, 10),
      endDate: new Date(y, m, 0).toISOString().slice(0, 10),
    });
    setActiveQuickFilter('thisMonth');
  };

  const applyQuickFilter = (key: string) => {
    const now = new Date();
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    let startDate: string;

    switch (key) {
      case 'lastMonth': {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = s.toISOString().slice(0, 10);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        break;
      }
      case 'threeMonths': {
        const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        startDate = d.toISOString().slice(0, 10);
        break;
      }
      case 'sixMonths': {
        const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        startDate = d.toISOString().slice(0, 10);
        break;
      }
      case 'oneYear': {
        const d = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        startDate = d.toISOString().slice(0, 10);
        break;
      }
      default: {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = d.toISOString().slice(0, 10);
        break;
      }
    }

    setActiveQuickFilter(key);
    setFilters({ startDate, endDate });
    setPage(1);
  };

  if (userLoading || !user) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t.transactions.title}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.scanButton, { borderColor: theme.colors.primary }]}
            onPress={handleScan}
            activeOpacity={0.8}
          >
            <Camera size={18} color={theme.colors.primary} />
            <Text style={[styles.scanButtonText, { color: theme.colors.primary }]}>{t.receiptScanner.scanButton}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddTransaction}
            activeOpacity={0.8}
          >
            <Plus size={20} color={theme.colors.white} />
            <Text style={[styles.addButtonText, { color: theme.colors.white }]}>{t.transactionForm.addButton}</Text>
          </TouchableOpacity>
        </View>

        <SummaryCard
          transactions={allTransactions}
          totalCount={totalCount}
          currencyCode={selectedCurrencyCode}
          locale={locale}
          theme={theme}
          t={t}
        />

        <View style={styles.dateFormatRow}>
          {DATE_FORMAT_OPTIONS.map((fmt) => {
            const isActive = dateFormat === fmt;
            return (
              <TouchableOpacity
                key={fmt}
                style={[
                  styles.dateFormatChip,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                    borderColor: isActive ? theme.colors.primary : theme.colors.gray300,
                  },
                ]}
                onPress={() => setDateFormat(fmt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateFormatText, { color: isActive ? '#fff' : theme.colors.textPrimary }]}>
                  {DATE_FORMAT_LABELS[fmt]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilterScroll} contentContainerStyle={styles.quickFilterContent}>
          {(['thisMonth', 'lastMonth', 'threeMonths', 'sixMonths', 'oneYear'] as const).map((key) => {
            const labels: Record<string, string> = {
              thisMonth: t.quickFilters.thisMonth,
              lastMonth: t.quickFilters.lastMonth,
              threeMonths: t.quickFilters.threeMonths,
              sixMonths: t.quickFilters.sixMonths,
              oneYear: t.quickFilters.oneYear,
            };
            const isActive = activeQuickFilter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.quickFilterChip, isActive && { backgroundColor: theme.colors.primary }]}
                onPress={() => applyQuickFilter(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickFilterText, { color: isActive ? '#fff' : theme.colors.textPrimary }]}>
                  {labels[key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.filterRow}>
          {isSelectionMode ? (
            <>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.secondary }]}
                onPress={exitSelectionMode}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterButtonText, { color: theme.colors.primary }]}>
                  {t.bulkDelete.exitSelect}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.selectionCount, { color: theme.colors.textSecondary }]}>
                {selectedIds.size} selected
              </Text>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.secondary }]}
                onPress={handleFilter}
                activeOpacity={0.8}
              >
                <Filter size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.secondary }]}
                onPress={handleExport}
                activeOpacity={0.8}
                disabled={isExporting}
              >
                {isExporting
                  ? <ActivityIndicator size="small" color={theme.colors.primary} />
                  : <Download size={18} color={theme.colors.primary} />
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectButton, { borderColor: theme.colors.primary }]}
                onPress={enterSelectionMode}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectButtonText, { color: theme.colors.primary }]}>
                  {t.bulkDelete.selectMode}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {txError && (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{txError.message}</Text>
        )}

        {txLoading && !refreshing ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
        ) : (
          transactions.map((tx) => {
            const isSelected = selectedIds.has(tx._id);
            const cardData: ExpandableCardData = {
              id: tx._id,
              title: tx.description,
              category: getCategoryName(tx) || t.transactions.uncategorized,
              description: tx.description,
              dateFull: formatDate(String(tx.date), locale),
              descriptionLong: tx.description,
              isFixed: !!tx.is_fixed,
              details: [
                { label: t.transactions.type, value: tx.type === 'income' ? t.transactions.income : t.transactions.expense },
                { label: t.transactions.amount, value: formatCurrency(tx.amount, selectedCurrencyCode, locale) },
                { label: t.transactions.fixed, value: tx.is_fixed ? 'Sim' : 'Não' },
              ],
            };
            return (
              <TouchableOpacity
                key={tx._id}
                activeOpacity={isSelectionMode ? 0.7 : 1}
                onLongPress={isSelectionMode ? undefined : enterSelectionMode}
                onPress={isSelectionMode ? () => toggleSelectId(tx._id) : undefined}
                delayLongPress={350}
              >
                <View style={styles.cardWrapper}>
                  {isSelectionMode && (
                    <View style={[
                      styles.checkbox,
                      { borderColor: theme.colors.primary },
                      isSelected && { backgroundColor: theme.colors.primary },
                    ]}>
                      {isSelected && <Check size={14} color="#fff" />}
                    </View>
                  )}
                  <View style={styles.cardContent}>
                    <ExpandableCard
                      data={cardData}
                      amountText={formatCurrency(tx.amount, selectedCurrencyCode, locale)}
                      amountColor={tx.type === 'income' ? theme.colors.success : theme.colors.danger}
                      theme={theme}
                      t={{ transactions: { seeMore: t.transactions.seeMore, seeLess: t.transactions.seeLess, edit: t.transactions.edit, delete: t.transactions.delete, date: t.transactions.date, description: t.transactions.description } }}
                      onEdit={() => openEdit(tx)}
                      onDelete={() => {
                        Alert.alert(
                          t.transactions.delete,
                          t.transactions.confirmDelete,
                          [
                            { text: t.transactionForm.cancel, style: 'cancel' },
                            {
                              text: t.transactions.delete,
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await deleteTransaction(tx._id);
                                  refetch();
                                } catch (err) {
                                  Alert.alert(t.transactions.title, err instanceof Error ? err.message : 'Error');
                                }
                              },
                            },
                          ]
                        );
                      }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Bulk action bar — visible in selection mode */}
        {isSelectionMode && (
          <View style={[styles.bulkBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.gray300 }]}>
            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: theme.colors.danger, opacity: selectedIds.size === 0 || isBulkDeleting ? 0.5 : 1 }]}
              onPress={handleBulkDelete}
              disabled={selectedIds.size === 0 || isBulkDeleting}
            >
              {isBulkDeleting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.bulkBtnText}>{t.bulkDelete.deleteSelected} ({selectedIds.size})</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkBtn, styles.bulkBtnOutline, { borderColor: theme.colors.danger, opacity: isBulkDeleting ? 0.5 : 1 }]}
              onPress={handleDeleteAll}
              disabled={isBulkDeleting}
            >
              <Text style={[styles.bulkBtnTextOutline, { color: theme.colors.danger }]}>{t.bulkDelete.deleteAll}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TransactionDetailModal
          visible={editModalVisible}
          transaction={selectedTransaction}
          currencyCode={selectedCurrencyCode}
          locale={locale}
          theme={theme}
          t={t}
          onClose={closeEdit}
          onDeleted={refetch}
          onUpdated={refetch}
        />

        <FilterModal
          visible={filterModalVisible}
          filters={filters}
          categories={categories}
          onApply={(f) => { setFilters(f); setActiveQuickFilter(''); }}
          onClose={() => setFilterModalVisible(false)}
          onReset={handleFilterReset}
        />

        <AddTransactionModal
          visible={addModalVisible}
          categories={categories}
          currencyCode={selectedCurrencyCode}
          onClose={() => setAddModalVisible(false)}
          onSuccess={refetch}
        />

        <ReceiptScannerModal
          visible={scanModalVisible}
          onClose={() => setScanModalVisible(false)}
          onSaveTransactions={handleSaveScanTransactions}
          categories={categories}
          addCategory={async (name) => {
            const c = await createCategory(name);
            if (c) setCategories((prev) => [...prev, c]);
            return c;
          }}
        />

        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={[styles.pageButton, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.pageButtonText}>{t.pagination.previous}</Text>
            </TouchableOpacity>
            <Text style={[styles.pageInfo, { color: theme.colors.textSecondary }]}>
              {page} / {totalPages}
            </Text>
            <TouchableOpacity
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={[styles.pageButton, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.pageButtonText}>{t.pagination.next}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  scanButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValuePositive: { fontSize: 14, fontWeight: '700' },
  summaryValueNegative: { fontSize: 14, fontWeight: '700' },
  summaryValueBalance: { fontSize: 14, fontWeight: '700' },
  summaryCount: { fontSize: 14, fontWeight: '600' },
  dateFormatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dateFormatChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateFormatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickFilterScroll: {
    marginBottom: 8,
    maxHeight: 44,
  },
  quickFilterContent: {
    gap: 8,
    paddingRight: 4,
  },
  quickFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickFilterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: 13,
    flex: 1,
    textAlign: 'center',
  },
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  bulkBar: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    marginTop: 8,
  },
  bulkBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  bulkBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bulkBtnTextOutline: {
    fontSize: 14,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  listHeaderDate: {
    width: 72,
    fontSize: 12,
    fontWeight: '700',
  },
  listHeaderDesc: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },
  listHeaderAmount: {
    width: 80,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  listHeaderAction: {
    width: 72,
    fontSize: 12,
    fontWeight: '700',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listCellDate: {
    width: 72,
    fontSize: 12,
  },
  listCellDesc: {
    flex: 1,
    fontSize: 13,
    marginRight: 8,
  },
  listCellAmount: {
    width: 80,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  verMaisWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 72,
    gap: 2,
  },
  verMaisText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    maxHeight: 400,
  },
  modalBodyContent: {
    padding: 16,
    paddingBottom: 24,
  },
  detailRow: {
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonTextDanger: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 14,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoriesScroll: {
    marginBottom: 14,
    maxHeight: 44,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    padding: 12,
    fontSize: 14,
  },
  loader: {
    marginVertical: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
  },
});
