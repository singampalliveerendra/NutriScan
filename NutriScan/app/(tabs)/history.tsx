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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/constants';
import { AnimatedPress, GlassCard } from '../../src/components';
import { calculateHealthRating, getRatingLabel, getRatingColor } from '../../src/utils';
import { ScanHistoryItem } from '../../src/types';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getHealthEmoji = (rating: string) => {
    switch (rating) {
      case 'healthy':
        return '✅';
      case 'moderate':
        return '⚠️';
      case 'unhealthy':
        return '❌';
      default:
        return '❓';
    }
  };

  const renderItem = ({ item, index }: { item: ScanHistoryItem; index: number }) => {
    const rating = calculateHealthRating(item.product.nutritionFacts);
    const ratingColor = getRatingColor(rating);
    
    return (
      <AnimatedPress
        onPress={() => handleProductPress(item)}
        style={[styles.historyCard, { backgroundColor: colors.surface }]}
      >
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            {item.product.imageUrl ? (
              <Image
                source={{ uri: item.product.imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={styles.placeholderEmoji}>📦</Text>
              </View>
            )}
            <View style={[styles.healthBadge, { backgroundColor: ratingColor }]}>
              <Text style={styles.healthEmoji}>{getHealthEmoji(rating)}</Text>
            </View>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
              {item.product.name}
            </Text>
            {item.product.brand && (
              <Text style={[styles.productBrand, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.product.brand}
              </Text>
            )}
            <View style={styles.metaRow}>
              <Text style={[styles.dateText, { color: colors.textTertiary }]}>{formatDate(item.scannedAt)}</Text>
              <Text style={[styles.timeText, { color: colors.textTertiary }]}>• {getTimeAgo(item.scannedAt)}</Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <View style={[styles.ratingBadge, { backgroundColor: ratingColor + '20' }]}>
              <Text style={[styles.ratingText, { color: ratingColor }]}>
                {getRatingLabel(rating)}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => handleRemoveItem(item.id)}
            >
              <Text style={styles.moreIcon}>•••</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedPress>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {state.scanHistory.length > 0 && (
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {state.scanHistory.length} {state.scanHistory.length === 1 ? 'Item' : 'Items'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Your scan history</Text>
          </View>
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: colors.error + '15' }]}
            onPress={handleClearHistory}
          >
            <Text style={[styles.clearButtonText, { color: colors.error }]}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={state.scanHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.emptyIcon}>📋</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Scan History</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Products you scan will appear here for easy access
            </Text>
            <TouchableOpacity 
              style={[styles.scanButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/scanner')}
            >
              <Text style={styles.scanButtonText}>Scan Now</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  clearButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  clearButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  historyCard: {
    borderRadius: BORDER_RADIUS.xxl,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'center',
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 28,
  },
  healthBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthEmoji: {
    fontSize: 12,
  },
  infoContainer: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  productName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 2,
    lineHeight: 20,
  },
  productBrand: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: FONT_SIZE.xs,
  },
  timeText: {
    fontSize: FONT_SIZE.xs,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  ratingBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  ratingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  moreButton: {
    padding: SPACING.xs,
  },
  moreIcon: {
    fontSize: FONT_SIZE.lg,
    color: '#94A3B8',
    letterSpacing: -2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  emptyIcon: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  scanButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.button,
  },
  scanButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
