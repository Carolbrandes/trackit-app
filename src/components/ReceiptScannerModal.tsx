import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Camera, X, Check } from 'lucide-react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/LanguageContext';
import { parseReceipt, parseReceiptWithFile, type ParsedReceipt, type ParsedReceiptItem } from '../services/api';
import type { ApiCategory } from '../services/api';

type SaveMode = 'items' | 'total';
type Step = 'upload' | 'processing' | 'review';

interface ReceiptScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveTransactions: (transactions: Array<{
    description: string;
    amount: number;
    currency: string;
    date: Date;
    type: 'expense' | 'income';
    is_fixed: boolean;
    category: string;
  }>) => Promise<void>;
  categories: ApiCategory[];
  addCategory: (name: string) => Promise<ApiCategory | undefined>;
}

function findBestCategoryMatch(suggestedName: string, categories: ApiCategory[]): string | null {
  if (!suggestedName || categories.length === 0) return null;
  const normalized = suggestedName.toLowerCase().trim();
  const exact = categories.find((c) => c.name.toLowerCase().trim() === normalized);
  if (exact) return exact._id;
  const partial = categories.find(
    (c) =>
      c.name.toLowerCase().includes(normalized) ||
      normalized.includes(c.name.toLowerCase())
  );
  return partial ? partial._id : null;
}

export function ReceiptScannerModal({
  visible,
  onClose,
  onSaveTransactions,
  categories,
  addCategory,
}: ReceiptScannerModalProps) {
  const { theme } = useThemeContext();
  const { t, locale } = useTranslation();
  const scan = t.receiptScanner;

  const [step, setStep] = useState<Step>('upload');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [detectedCurrency, setDetectedCurrency] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mode, setMode] = useState<SaveMode>('total');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [categoryId, setCategoryId] = useState('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [totalDescription, setTotalDescription] = useState('');
  const [editedItems, setEditedItems] = useState<ParsedReceiptItem[]>([]);
  const [isFixed, setIsFixed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('upload');
    setPreviewUri(null);
    setReceipt(null);
    setDetectedCurrency('');
    setTransactionDate(new Date());
    setMode('total');
    setSelectedItems(new Set());
    setCategoryId('');
    setTransactionType('expense');
    setTotalDescription('');
    setEditedItems([]);
    setIsFixed(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickImage = (useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.6,
      base64: true,
    };
    if (useCamera) {
      ImagePicker.launchCameraAsync(options).then(handlePickResult);
    } else {
      ImagePicker.launchImageLibraryAsync(options).then(handlePickResult);
    }
  };

  const handlePickResult = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!validTypes.includes(mimeType)) {
      setError(scan.invalidFormat);
      return;
    }
    setError(null);
    setStep('processing');
    setPreviewUri(asset.uri);

    if (!asset.uri && !asset.base64) {
      setError(scan.genericError);
      setStep('upload');
      return;
    }

    const categoryNames = categories.map((c) => c.name);
    try {
      let parseResult: Awaited<ReturnType<typeof parseReceipt>>;
      if (asset.uri) {
        const compressed = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        parseResult = await parseReceiptWithFile(
          compressed.uri,
          'receipt.jpg',
          'image/jpeg',
          locale,
          categoryNames
        );
      } else {
        parseResult = await parseReceipt(asset.base64!, mimeType, locale, categoryNames);
      }
      if (!parseResult.success) {
        const errorMap: Record<string, string> = {
          NOT_A_RECEIPT: scan.notAReceipt,
          RATE_LIMIT: scan.rateLimitError,
        };
        setError(errorMap[parseResult.error ?? ''] ?? scan.genericError);
        setStep('upload');
        return;
      }
      if (parseResult.data) {
        setReceipt(parseResult.data);
        setDetectedCurrency(parseResult.data.currency ?? '');
        setTransactionType(parseResult.data.type);
        setTotalDescription(parseResult.data.storeName ?? '');
        setEditedItems([...parseResult.data.items]);
        setSelectedItems(new Set(parseResult.data.items.map((_, i) => i)));
        const matchedId = findBestCategoryMatch(parseResult.data.suggestedCategory, categories);
        setCategoryId(matchedId ?? categories[0]?._id ?? '');
        setStep('review');
      }
    } catch {
      setError(scan.genericError);
      setStep('upload');
    }
  };

  const showImageSourcePicker = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(scan.title, scan.uploadText, [
        { text: t.editModal.cancel, style: 'cancel' },
        { text: 'Gallery', onPress: () => pickImage(false) },
        { text: 'Camera', onPress: () => pickImage(true) },
      ]);
    } else {
      Alert.alert(scan.title, scan.uploadText, [
        { text: t.editModal.cancel, style: 'cancel' },
        { text: 'Gallery', onPress: () => pickImage(false) },
        { text: 'Camera', onPress: () => pickImage(true) },
      ]);
    }
  };

  const toggleItem = (index: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAllItems = () => {
    if (!receipt) return;
    if (selectedItems.size === receipt.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(receipt.items.map((_, i) => i)));
    }
  };

  const updateItemDescription = (index: number, value: string) => {
    setEditedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], description: value };
      return next;
    });
  };

  const currencyToUse = detectedCurrency || 'BRL';

  const handleSave = async () => {
    if (!receipt || !categoryId) return;
    setIsSaving(true);
    setError(null);
    try {
      const dateToUse = transactionDate;
      if (mode === 'total') {
        await onSaveTransactions([{
          description: totalDescription || scan.receiptPurchase,
          amount: receipt.total,
          currency: currencyToUse,
          date: dateToUse,
          type: transactionType,
          is_fixed: isFixed,
          category: categoryId,
        }]);
      } else {
        const items = editedItems
          .filter((_, i) => selectedItems.has(i))
          .map((item) => ({
            description: item.description,
            amount: item.amount * (item.quantity ?? 1),
            currency: currencyToUse,
            date: dateToUse,
            type: transactionType,
            is_fixed: isFixed,
            category: categoryId,
          }));
        if (items.length === 0) {
          setError(scan.noItemsSelected);
          setIsSaving(false);
          return;
        }
        await onSaveTransactions(items);
      }
      handleClose();
    } catch {
      setError(scan.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const onDateChange = (_: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setTransactionDate(date);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.gray300 }]}>
            <View style={styles.headerTitleRow}>
              <Camera size={20} color={theme.colors.primary} />
              <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{scan.title}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <X size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: theme.colors.danger + '20' }]}>
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
              </View>
            ) : null}

            {step === 'upload' && (
              <>
                <TouchableOpacity
                  style={[styles.uploadArea, { borderColor: theme.colors.gray300 }]}
                  onPress={showImageSourcePicker}
                  activeOpacity={0.8}
                >
                  <Camera size={40} color={theme.colors.primary} />
                  <Text style={[styles.uploadText, { color: theme.colors.textPrimary }]}>{scan.uploadText}</Text>
                  <Text style={[styles.uploadHint, { color: theme.colors.textSecondary }]}>{scan.uploadHint}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.colors.gray300 }]} onPress={handleClose}>
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>{t.editModal.cancel}</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'processing' && (
              <View style={styles.processingRow}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.processingText, { color: theme.colors.textPrimary }]}>{scan.processing}</Text>
                {previewUri ? <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" /> : null}
              </View>
            )}

            {step === 'review' && receipt && (
              <>
                {previewUri ? <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" /> : null}
                <View style={[styles.receiptInfo, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.storeName, { color: theme.colors.textPrimary }]}>{receipt.storeName}</Text>
                  <Text style={[styles.receiptMeta, { color: theme.colors.textSecondary }]}>{receipt.date}</Text>
                  <Text style={[styles.receiptTotal, { color: theme.colors.textPrimary }]}>
                    Total: {currencyToUse} {receipt.total.toFixed(2)}
                  </Text>
                  {receipt.suggestedCategory ? (
                    <Text style={[styles.suggestedCat, { color: theme.colors.textSecondary }]}>
                      {scan.suggestedCategory}: {receipt.suggestedCategory}
                    </Text>
                  ) : null}
                </View>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.date}</Text>
                <TouchableOpacity style={[styles.dateTouch, { backgroundColor: theme.colors.background, borderColor: theme.colors.gray300 }]} onPress={() => setShowDatePicker(true)}>
                  <Text style={{ color: theme.colors.textPrimary }}>
                    {transactionDate.toISOString().slice(0, 10)}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={transactionDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                  />
                )}

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.type}</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, transactionType === 'expense' && { backgroundColor: theme.colors.danger }]}
                    onPress={() => setTransactionType('expense')}
                  >
                    <Text style={[styles.typeBtnText, { color: transactionType === 'expense' ? '#fff' : theme.colors.textPrimary }]}>{t.transactions.expense}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, transactionType === 'income' && { backgroundColor: theme.colors.success }]}
                    onPress={() => setTransactionType('income')}
                  >
                    <Text style={[styles.typeBtnText, { color: transactionType === 'income' ? '#fff' : theme.colors.textPrimary }]}>{t.transactions.income}</Text>
                  </TouchableOpacity>
                </View>

                {receipt.items.length > 1 && (
                  <>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{scan.saveAs}</Text>
                    <View style={styles.modeRow}>
                      <TouchableOpacity
                        style={[styles.modeBtn, mode === 'total' && { backgroundColor: theme.colors.primary }]}
                        onPress={() => setMode('total')}
                      >
                        <Text style={[styles.modeBtnText, { color: mode === 'total' ? '#fff' : theme.colors.textPrimary }]}>{scan.modeTotal}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modeBtn, mode === 'items' && { backgroundColor: theme.colors.primary }]}
                        onPress={() => setMode('items')}
                      >
                        <Text style={[styles.modeBtnText, { color: mode === 'items' ? '#fff' : theme.colors.textPrimary }]}>{scan.modeItems}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {mode === 'total' && (
                  <>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.description}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.gray300 }]}
                      value={totalDescription}
                      onChangeText={setTotalDescription}
                      placeholder={scan.receiptPurchase}
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                  </>
                )}

                {mode === 'items' && (
                  <>
                    <Text style={[styles.selectedCount, { color: theme.colors.textPrimary }]}>
                      {scan.selectedCount.replace('{selected}', String(selectedItems.size)).replace('{total}', String(receipt.items.length))}{' '}
                      <Text style={styles.linkText} onPress={toggleAllItems}>
                        {selectedItems.size === receipt.items.length ? scan.deselectAll : scan.selectAll}
                      </Text>
                    </Text>
                    <ScrollView style={styles.itemsList} nestedScrollEnabled>
                      {editedItems.map((item, i) => (
                        <TouchableOpacity
                          key={`${i}-${item.amount}`}
                          style={[
                            styles.itemCard,
                            { borderColor: theme.colors.gray300, backgroundColor: selectedItems.has(i) ? theme.colors.secondary : theme.colors.background },
                          ]}
                          onPress={() => toggleItem(i)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.itemCheckbox, selectedItems.has(i) && { backgroundColor: theme.colors.primary }]}>
                            {selectedItems.has(i) ? <Check size={14} color="#fff" /> : null}
                          </View>
                          <View style={styles.itemDetails}>
                            <TextInput
                              style={[styles.itemInput, { color: theme.colors.textPrimary }]}
                              value={item.description}
                              onChangeText={(v) => updateItemDescription(i, v)}
                              onPressIn={(e) => e.stopPropagation()}
                            />
                            {item.quantity != null && item.quantity > 1 ? (
                              <Text style={[styles.itemQty, { color: theme.colors.textSecondary }]}>x{item.quantity}</Text>
                            ) : null}
                          </View>
                          <Text style={[styles.itemAmount, { color: theme.colors.textPrimary }]}>
                            {currencyToUse} {(item.amount * (item.quantity ?? 1)).toFixed(2)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.category}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c._id}
                      style={[styles.categoryChip, categoryId === c._id && { backgroundColor: theme.colors.primary }]}
                      onPress={() => setCategoryId(c._id)}
                    >
                      <Text style={[styles.categoryChipText, { color: categoryId === c._id ? '#fff' : theme.colors.textPrimary }]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.fixedRow}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t.transactionForm.fixedTransaction}</Text>
                  <Switch value={isFixed} onValueChange={setIsFixed} trackColor={{ false: theme.colors.gray300, true: theme.colors.primary }} thumbColor="#fff" />
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]} onPress={handleSave} disabled={isSaving}>
                    <Text style={styles.primaryButtonText}>{isSaving ? t.common.processing : scan.saveButton}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.colors.gray300 }]} onPress={reset}>
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>{scan.scanAnother}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
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
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    maxHeight: 600,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: 13,
    marginTop: 4,
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  processingRow: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  processingText: {
    fontSize: 16,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  receiptInfo: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  storeName: {
    fontSize: 17,
    fontWeight: '700',
  },
  receiptMeta: { fontSize: 13, marginTop: 4 },
  receiptTotal: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  suggestedCat: { fontSize: 13, marginTop: 4 },
  label: {
    fontSize: 12,
    marginBottom: 6,
    marginTop: 10,
  },
  dateTouch: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  selectedCount: {
    fontSize: 14,
    marginBottom: 8,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  itemsList: {
    maxHeight: 220,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  itemCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemInput: {
    fontSize: 14,
    padding: 0,
  },
  itemQty: {
    fontSize: 12,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryRow: {
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  buttonRow: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
