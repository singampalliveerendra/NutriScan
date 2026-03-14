import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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
        <View style={styles.waveContainer}>
          <Text style={styles.waveEmoji}>👋</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appName}>NutriScan</Text>
        <Text style={styles.tagline}>
          Scan your food to check health
        </Text>
      </View>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleScanPress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Scan Food"
        accessibilityHint="Opens camera to scan food barcode"
      >
        <View style={styles.scanButtonContent}>
          <View style={styles.scanIconContainer}>
            <Text style={styles.scanIcon}>📷</Text>
          </View>
          <Text style={styles.scanButtonTitle}>Scan Food</Text>
          <Text style={styles.scanButtonSubtitle}>
            Point camera at barcode
          </Text>
        </View>
        <View style={styles.scanButtonArrow}>
          <Text style={styles.arrowIcon}>→</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleSearchPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Search Food"
        accessibilityHint="Opens search to find food manually"
      >
        <View style={styles.searchIconContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
        <Text style={styles.searchButtonTitle}>Search Food</Text>
        <Text style={styles.searchButtonSubtitle}>
          Find nutrition info manually
        </Text>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayScans}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{state.scanHistory.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {recentScans.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

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
                        <Text style={styles.placeholderEmoji}>📦</Text>
                      </View>
                    )}
                    <View style={[
                      styles.ratingIndicator,
                      { backgroundColor: getRatingColor(rating) }
                    ]} />
                  </View>
                  <Text style={styles.recentName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <View
                    style={[
                      styles.recentRating,
                      {
                        backgroundColor: getRatingColor(rating) + '20',
                      },
                    ]}
                  >
                    <Text style={[
                      styles.recentRatingText,
                      { color: getRatingColor(rating) }
                    ]}>
                      {getRatingLabel(rating)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {recentScans.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>🥗</Text>
          </View>
          <Text style={styles.emptyTitle}>Start Scanning!</Text>
          <Text style={styles.emptyText}>
            Scan a barcode or search for a product to see nutrition info
          </Text>
          <View style={styles.emptyButtons}>
            <Button
              title="Scan Now"
              onPress={handleScanPress}
              variant="primary"
              size="large"
              icon={<Text style={styles.buttonIcon}>📷</Text>}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  waveContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  waveEmoji: {
    fontSize: 32,
  },
  welcomeText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  appName: {
    fontSize: FONT_SIZE.title,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.large,
    marginBottom: SPACING.md,
  },
  scanButtonContent: {
    flex: 1,
  },
  scanIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  scanIcon: {
    fontSize: 28,
  },
  scanButtonTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  scanButtonSubtitle: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  scanButtonArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 24,
    color: COLORS.white,
  },
  searchButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.small,
    marginBottom: SPACING.lg,
  },
  searchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  searchIcon: {
    fontSize: 24,
  },
  searchButtonTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  searchButtonSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  statNumber: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  recentSection: {
    marginTop: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  recentCard: {
    width: 130,
    marginRight: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    ...SHADOWS.small,
  },
  recentImageContainer: {
    width: '100%',
    height: 90,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    position: 'relative',
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
  placeholderEmoji: {
    fontSize: 36,
  },
  ratingIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recentName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  recentRating: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  recentRatingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    lineHeight: 22,
  },
  emptyButtons: {
    width: '100%',
    paddingHorizontal: SPACING.xl,
  },
  buttonIcon: {
    fontSize: 18,
  },
});
