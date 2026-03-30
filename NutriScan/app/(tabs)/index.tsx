import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import { AnimatedPress, GlassCard } from '../../src/components';
import { BORDER_RADIUS, SPACING, FONT_SIZE, SHADOWS } from '../../src/constants';
import { Product, HealthRating } from '../../src/types';
import { calculateHealthRating, getRatingColor, getRatingLabel } from '../../src/utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { state, getRecentScans } = useApp();
  const recentScans = getRecentScans(5);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleScanPress = () => {
    router.push('/scanner');
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleBarcodePress = () => {
    router.push('/scanner');
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${encodeURIComponent(product.barcode || product.id)}`);
  };

  const todayScans = state.scanHistory.filter(item => {
    const today = new Date().toDateString();
    return new Date(item.scannedAt).toDateString() === today;
  }).length;

  const weekScans = state.scanHistory.filter(item => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(item.scannedAt) >= weekAgo;
  }).length;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient
          colors={isDark ? ['#1a1a2e', '#16213e'] : ['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Scan your food</Text>
            <Text style={styles.heroSubtitle}>Know what you eat instantly</Text>
            
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleScanPress}
                activeOpacity={0.9}
              >
                <View style={styles.scanButtonContent}>
                  <View style={styles.scanIconContainer}>
                    <Text style={styles.scanIcon}>📷</Text>
                  </View>
                  <Text style={styles.scanButtonTitle}>Tap to Scan</Text>
                  <Text style={styles.scanButtonSubtitle}>
                    Point at barcode
                  </Text>
                </View>
                <View style={styles.scanButtonArrow}>
                  <Text style={styles.arrowIcon}>→</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          <View style={styles.heroDecor}>
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.quickActions}>
        <AnimatedPress
          onPress={handleScanPress}
          style={[styles.actionCard, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.actionIcon}>📷</Text>
          </View>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Scan Food</Text>
          <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
            Use camera
          </Text>
        </AnimatedPress>

        <AnimatedPress
          onPress={handleSearchPress}
          style={[styles.actionCard, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.actionIcon}>🔍</Text>
          </View>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Search</Text>
          <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
            Find manually
          </Text>
        </AnimatedPress>

        <AnimatedPress
          onPress={handleBarcodePress}
          style={[styles.actionCard, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.actionIcon}>🔢</Text>
          </View>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Barcode</Text>
          <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
            Enter number
          </Text>
        </AnimatedPress>
      </View>

      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Activity</Text>
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statNumber}>{todayScans}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.primary }]} />
          </GlassCard>
          <View style={{ width: SPACING.md }} />
          <GlassCard style={styles.statCard}>
            <Text style={styles.statNumber}>{weekScans}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Week</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.secondary }]} />
          </GlassCard>
          <View style={{ width: SPACING.md }} />
          <GlassCard style={styles.statCard}>
            <Text style={styles.statNumber}>{state.scanHistory.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.warning }]} />
          </GlassCard>
        </View>
      </View>

      {recentScans.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Scans</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScrollContent}
          >
            {recentScans.map((item, index) => {
              const rating = calculateHealthRating(item.product.nutritionFacts);
              const ratingColor = getRatingColor(rating);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.recentCard, { backgroundColor: colors.surface }]}
                  onPress={() => handleProductPress(item.product)}
                  activeOpacity={0.9}
                >
                  <View style={styles.recentImageContainer}>
                    {item.product.imageUrl ? (
                      <Image
                        source={{ uri: item.product.imageUrl }}
                        style={styles.recentImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.recentPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                        <Text style={styles.placeholderEmoji}>📦</Text>
                      </View>
                    )}
                    <View style={[styles.ratingIndicator, { backgroundColor: ratingColor }]} />
                  </View>
                  <Text style={[styles.recentName, { color: colors.text }]} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <View style={[styles.recentRatingBadge, { backgroundColor: ratingColor + '20' }]}>
                    <Text style={[styles.recentRatingText, { color: ratingColor }]}>
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
        <GlassCard style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>🥗</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Start Scanning!</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Scan a barcode or search for a product to see nutrition info
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={handleScanPress}
          >
            <Text style={styles.emptyButtonText}>Scan Now</Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Made with ❤️ for healthier choices
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  heroSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  heroGradient: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    padding: SPACING.lg,
    minHeight: 240,
    position: 'relative',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  heroTitle: {
    fontSize: FONT_SIZE.hero,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.lg,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: SPACING.lg,
  },
  scanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scanButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  scanIcon: {
    fontSize: 24,
  },
  scanButtonTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanButtonSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scanButtonArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    color: '#10B981',
  },
  heroDecor: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  decorCircle1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  decorCircle2: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    position: 'absolute',
    right: 60,
    top: 40,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: FONT_SIZE.xs,
  },
  statsSection: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCardBase: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  statNumber: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    color: '#10B981',
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
  statIndicator: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginTop: SPACING.sm,
  },
  recentSection: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  recentScrollContent: {
    paddingHorizontal: SPACING.md,
  },
  recentCard: {
    width: SCREEN_WIDTH * 0.38,
    marginRight: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.sm,
    ...SHADOWS.small,
  },
  recentImageContainer: {
    width: '100%',
    height: 90,
    borderRadius: BORDER_RADIUS.lg,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
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
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  recentRatingBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  recentRatingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  emptyState: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
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
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  emptyButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  footerText: {
    fontSize: FONT_SIZE.sm,
  },
});
