import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface ExpandableCardData {
  id: string;
  title: string;
  category: string;
  description: string;
  /** Full date string for expanded view */
  dateFull: string;
  /** Long/full description for expanded view */
  descriptionLong?: string;
  /** Extra details to show when expanded (e.g. type, amount, fixed) */
  details?: { label: string; value: string }[];
}

interface ExpandableCardProps {
  data: ExpandableCardData;
  onEdit: () => void;
  onDelete: () => void;
  /** Optional: amount text to show in header (e.g. "R$ 100,00") */
  amountText?: string;
  /** Optional: color for amount (income=green, expense=red) */
  amountColor?: string;
  /** Theme colors */
  theme: {
    colors: {
      surface: string;
      textPrimary: string;
      textSecondary: string;
      primary: string;
      danger: string;
      gray300: string;
    };
  };
  t: {
    transactions: {
      seeMore: string;
      seeLess?: string;
      edit: string;
      delete: string;
      date: string;
      description: string;
    };
  };
}

const DESCRIPTION_LINES = 2;

export function ExpandableCard({
  data,
  onEdit,
  onDelete,
  amountText,
  amountColor,
  theme,
  t,
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const seeLessLabel = t.transactions.seeLess ?? 'Ver menos';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          ...Platform.select({
            android: { elevation: 3 },
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
          }),
        },
      ]}
    >
      {/* Header: title + category + description (2 lines) + amount + Ver mais */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {data.title}
          </Text>
          {amountText != null && (
            <Text style={[styles.amount, { color: amountColor ?? theme.colors.textPrimary }]} numberOfLines={1}>
              {amountText}
            </Text>
          )}
        </View>
        <Text style={[styles.category, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {data.category}
        </Text>
        <Text style={[styles.descriptionShort, { color: theme.colors.textPrimary }]} numberOfLines={DESCRIPTION_LINES}>
          {data.description}
        </Text>
        <TouchableOpacity style={styles.verMaisTouch} onPress={toggle} activeOpacity={0.7}>
          <Text style={[styles.verMaisText, { color: theme.colors.primary }]}>
            {expanded ? seeLessLabel : t.transactions.seeMore}
          </Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={[styles.expanded, { borderTopColor: theme.colors.gray300 }]}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.date}</Text>
          <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>{data.dateFull}</Text>

          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.transactions.description}</Text>
          <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
            {data.descriptionLong ?? data.description}
          </Text>

          {data.details?.map((d, i) => (
            <View key={i}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{d.label}</Text>
              <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>{d.value}</Text>
            </View>
          ))}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.primary }]} onPress={onEdit}>
              <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>{t.transactions.edit}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtnDanger, { backgroundColor: theme.colors.danger }]} onPress={onDelete}>
              <Text style={styles.actionBtnTextDanger}>{t.transactions.delete}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  category: {
    fontSize: 13,
    marginBottom: 6,
  },
  descriptionShort: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  verMaisTouch: {
    alignSelf: 'flex-start',
  },
  verMaisText: {
    fontSize: 14,
    fontWeight: '600',
  },
  expanded: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
    marginTop: 10,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionBtnDanger: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnTextDanger: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
