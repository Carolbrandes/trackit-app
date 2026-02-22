import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { useTranslation } from '../../src/contexts/LanguageContext';
import { useUserData } from '../../src/hooks/useUserData';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type ApiCategory,
} from '../../src/services/api';

export default function CategoriesScreen() {
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const { user } = useUserData();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user?._id) return;
    setLoading(true);
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [user?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    setSubmitting(true);
    try {
      await createCategory(trimmed);
      setName('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat: ApiCategory) => {
    setEditingId(cat._id);
    setEditName(cat.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    setError(null);
    try {
      await updateCategory(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t.categories.delete,
      'Delete this category?',
      [
        { text: t.categories.cancel, style: 'cancel' },
        {
          text: t.categories.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(id);
              load();
            } catch {
              setError('Error deleting');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t.categories.title}</Text>

        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{t.categories.addNew}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.gray300 }]}
            value={name}
            onChangeText={setName}
            placeholder={t.categories.namePlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
          />
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAdd}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>{submitting ? t.categories.adding : t.categories.addButton}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{t.categories.existing}</Text>
          {error && <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>}
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
          ) : categories.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t.categories.noCategories}</Text>
          ) : (
            categories.map((cat) => (
              <View
                key={cat._id}
                style={[styles.listItem, { borderBottomColor: theme.colors.gray300 }]}
              >
                {editingId === cat._id ? (
                  <>
                    <TextInput
                      style={[styles.input, styles.inputSmall, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.gray300 }]}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder={t.categories.namePlaceholder}
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                    <View style={styles.buttonRow}>
                      <TouchableOpacity style={[styles.smallButton, { backgroundColor: theme.colors.primary }]} onPress={handleUpdate}>
                        <Text style={styles.smallButtonTextWhite}>{t.categories.save}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallButton, { borderColor: theme.colors.gray300 }]} onPress={handleCancelEdit}>
                        <Text style={[styles.smallButtonText, { color: theme.colors.textPrimary }]}>{t.categories.cancel}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={[styles.listItemText, { color: theme.colors.textPrimary }]}>{cat.name}</Text>
                    <View style={styles.buttonRow}>
                      <TouchableOpacity style={[styles.smallButton, { borderColor: theme.colors.primary }]} onPress={() => handleEdit(cat)}>
                        <Text style={[styles.smallButtonText, { color: theme.colors.primary }]}>{t.categories.edit}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallButton, { borderColor: theme.colors.danger }]} onPress={() => handleDelete(cat._id)}>
                        <Text style={[styles.smallButtonText, { color: theme.colors.danger }]}>{t.categories.delete}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ))
          )}
        </View>
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
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  inputSmall: {
    marginBottom: 8,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listItemText: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  smallButtonTextWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  loader: {
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    paddingVertical: 16,
  },
});
