import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/constants';
import { calculateHealthRating, getRatingLabel, getRatingColor } from '../../src/utils';
import { ScanHistoryItem } from '../../src/types';

export default function HistoryScreen() {
  const router = useRouter();
  const { state, clearHistory, removeFromHistory } = useApp();

  const handleProductPress = (item: ScanHistoryItem) => {
    router.push(`/product/${encodeURIComponent(item.product.barcode || item.product.id)}`);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearHistory,
        },
      ]
    );
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromHistory(id),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => {
    const rating = calculateHealthRating(item.product.nutritionFacts);
    
    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => handleProductPress(item)}
        onLongPress={() => handleRemoveItem(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.product.name}, scanned ${formatDate(item.scannedAt)}`}
      >
        <View style={styles.itemImageContainer}>
          {item.product.imageUrl ? (
            <Image
              source={{ uri: item.product.imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.itemPlaceholder}>
              <Text>📦</Text>
            </View>
          )}
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.product.name}
          </Text>
          {item.product.brand && (
            <Text style={styles.itemBrand} numberOfLines={1}>
              {item.product.brand}
            </Text>
          )}
          <View style={styles.itemMeta}>
            <Text style={styles.itemDate}>{formatDate(item.scannedAt)}</Text>
            <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(rating) }]}>
              <Text style={styles.ratingText}>{getRatingLabel(rating)}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveItem(item.id)}
          accessibilityRole="button"
          accessibilityLabel="Delete item"
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {state.scanHistory.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {state.scanHistory.length} item{state.scanHistory.length !== 1 ? 's' : ''} in history
          </Text>
          <TouchableOpacity
            onPress={handleClearHistory}
            accessibilityRole="button"
            accessibilityLabel="Clear all history"
          >
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={state.scanHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No scan history</Text>
            <Text style={styles.emptySubtext}>
              Products you scan will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  clearButton: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  itemImageContainer: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  itemDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  ratingBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  ratingText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  deleteButton: {
    padding: SPACING.xs,
    alignSelf: 'flex-start',
  },
  deleteIcon: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
