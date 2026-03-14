import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { Button } from '../../src/components';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/constants';
import { Product, HealthRating } from '../../src/types';
import { calculateHealthRating, getRatingColor, getRatingLabel } from '../../src/utils';

export default function HomeScreen() {
  const router = useRouter();
  const { state, getRecentScans } = useApp();
  const recentScans = getRecentScans(5);

  const handleScanPress = () => {
    router.push('/scanner');
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${encodeURIComponent(product.barcode || product.id)}`);
  };

  const todayScans = state.scanHistory.filter(item => {
    const today = new Date().toDateString();
    return new Date(item.scannedAt).toDateString() === today;
  }).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroSection}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appName}>NutriScan</Text>
        <Text style={styles.tagline}>
          Make healthier food choices with instant nutrition info
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.scanButton]}
          onPress={handleScanPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Scan Barcode"
          accessibilityHint="Opens camera to scan food barcode"
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>Scan Barcode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.searchButton]}
          onPress={handleSearchPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Search Manually"
          accessibilityHint="Opens search to find food manually"
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={[styles.actionText, styles.searchButtonText]}>Search Manually</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayScans}</Text>
          <Text style={styles.statLabel}>Scans Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{state.scanHistory.length}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
      </View>

      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
        </View>

        {state.isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : recentScans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No scans yet</Text>
            <Text style={styles.emptySubtext}>
              Scan a barcode or search for a product to get started
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentScans.map((item) => {
              const rating = calculateHealthRating(item.product.nutritionFacts);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recentCard}
                  onPress={() => handleProductPress(item.product)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.product.name}, ${rating} rating`}
                >
                  <View style={styles.recentImageContainer}>
                    {item.product.imageUrl ? (
                      <Image
                        source={{ uri: item.product.imageUrl }}
                        style={styles.recentImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.recentPlaceholder}>
                        <Text>📦</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.recentName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <View
                    style={[
                      styles.recentRating,
                      {
                        backgroundColor: getRatingColor(rating),
                      },
                    ]}
                  >
                    <Text style={styles.recentRatingText}>
                      {getRatingLabel(rating)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  welcomeText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
  },
  appName: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
  },
  searchButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  searchButtonText: {
    color: COLORS.secondary,
  },
  statsSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  recentSection: {
    marginTop: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  recentCard: {
    width: 120,
    marginRight: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    ...SHADOWS.small,
  },
  recentImageContainer: {
    width: '100%',
    height: 80,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  recentImage: {
    width: '100%',
    height: '100%',
  },
  recentPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  recentRating: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  recentRatingText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
});
