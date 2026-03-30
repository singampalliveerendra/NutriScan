import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/constants';
import { GradientButton, GlassCard, AnimatedPress, Skeleton } from '../../src/components';
import { Product } from '../../src/types';
import { calculateHealthRating, generateAIExplanation, getRatingColor, getRatingLabel } from '../../src/utils';
import { fetchProductByBarcode, saveScanRecord, ManualProductRequiredError } from '../../src/services/foodApi';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { id, product: productParam } = useLocalSearchParams<{
    id: string;
    product?: string;
  }>();
  const { addToHistory, state } = useApp();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!productParam);
  const [saved, setSaved] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (product) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [product]);

  useEffect(() => {
    if (product) {
      const exists = state.scanHistory.some(
        item => item.product.barcode === product.barcode
      );
      setSaved(exists);
    }
  }, [state.scanHistory, product]);

  useEffect(() => {
    if (productParam) {
      try {
        const parsed = JSON.parse(productParam) as Product;
        setProduct(parsed);
        
        const exists = state.scanHistory.some(
          item => item.product.barcode === parsed.barcode
        );
        setSaved(exists);
      } catch (error) {
        console.error('Error parsing product:', error);
        loadProduct();
      }
    } else {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const fetchedProduct = await fetchProductByBarcode(id);
      if (fetchedProduct) {
        setProduct(fetchedProduct);
        const exists = state.scanHistory.some(
          item => item.product.barcode === fetchedProduct.barcode
        );
        setSaved(exists);
      }
    } catch (error) {
      if (error instanceof ManualProductRequiredError) {
        Alert.alert('Product Not Found', "We couldn't find this product yet. Try manual search or scan a different barcode.");
      } else {
        Alert.alert('Error', 'Failed to load product details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (product) {
      const rating = calculateHealthRating(product.nutritionFacts);
      addToHistory(product);
      setSaved(true);
      
      try {
        await saveScanRecord(product.barcode, product.name, rating);
      } catch (err) {
        console.log('Failed to save scan record to database:', err);
      }
      
      Alert.alert('Saved!', 'Product added to your history');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: colors.surface }]}>
          <Skeleton width={200} height={200} borderRadius={BORDER_RADIUS.xxl} />
          <Skeleton width="80%" height={24} style={{ marginTop: SPACING.lg }} />
          <Skeleton width="50%" height={16} style={{ marginTop: SPACING.sm }} />
          <Skeleton width="100%" height={80} borderRadius={BORDER_RADIUS.lg} style={{ marginTop: SPACING.lg }} />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.errorIconContainer, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={styles.errorIcon}>🔍</Text>
        </View>
        <Text style={[styles.errorText, { color: colors.text }]}>Product not found</Text>
        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
          We couldn't find this product yet
        </Text>
        <View style={styles.errorButtons}>
          <GradientButton
            title="Go Back"
            onPress={() => router.back()}
            variant="secondary"
            style={{ flex: 1 }}
          />
          <GradientButton
            title="Search"
            onPress={() => router.push('/search')}
            variant="primary"
            style={{ flex: 1 }}
          />
        </View>
      </View>
    );
  }

  const rating = calculateHealthRating(product.nutritionFacts);
  const aiExplanation = generateAIExplanation(product.nutritionFacts, rating);
  const ratingColor = getRatingColor(rating);

  const getRatingGradient = (): [string, string] => {
    switch (rating) {
      case 'healthy':
        return ['#22C55E', '#16A34A'];
      case 'moderate':
        return ['#F59E0B', '#D97706'];
      case 'avoid':
        return ['#EF4444', '#DC2626'];
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.header, 
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }] 
            }
          ]}
        >
          <LinearGradient
            colors={getRatingGradient() as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.imageGradient}
          >
            <View style={styles.imageContainer}>
              {product.imageUrl ? (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.placeholderIcon}>📦</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
          {product.brand && (
            <Text style={[styles.productBrand, { color: colors.textSecondary }]}>{product.brand}</Text>
          )}
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <LinearGradient
            colors={getRatingGradient() as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.healthBadge}
          >
            <View style={styles.healthBadgeContent}>
              <View style={styles.healthBadgeIcon}>
                <Text style={styles.healthBadgeEmoji}>
                  {rating === 'healthy' ? '✓' : rating === 'moderate' ? '⚠' : '✕'}
                </Text>
              </View>
              <View>
                <Text style={styles.healthBadgeTitle}>
                  {rating === 'healthy' ? 'Healthy Choice!' : rating === 'moderate' ? 'Moderate' : 'Best to Avoid'}
                </Text>
                <Text style={styles.healthBadgeSubtitle}>
                  Based on sugar, sodium & saturated fat
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nutrition Facts</Text>
          <Text style={[styles.servingSize, { color: colors.textSecondary }]}>Per 100g serving</Text>
          
          <View style={styles.nutritionGrid}>
            <GlassCard style={styles.nutritionCard}>
              <View style={[styles.nutritionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.nutritionEmoji}>🔥</Text>
              </View>
              <Text style={[styles.nutritionTitle, { color: colors.textSecondary }]}>Calories</Text>
              <Text style={[styles.nutritionValue, { color: '#EF4444' }]}>
                {product.nutritionFacts.calories.toFixed(0)}
              </Text>
              <Text style={[styles.nutritionUnit, { color: colors.textTertiary }]}>kcal</Text>
            </GlassCard>
            
            <GlassCard style={styles.nutritionCard}>
              <View style={[styles.nutritionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.nutritionEmoji}>💪</Text>
              </View>
              <Text style={[styles.nutritionTitle, { color: colors.textSecondary }]}>Protein</Text>
              <Text style={[styles.nutritionValue, { color: '#3B82F6' }]}>
                {product.nutritionFacts.protein.toFixed(1)}
              </Text>
              <Text style={[styles.nutritionUnit, { color: colors.textTertiary }]}>g</Text>
            </GlassCard>
            
            <GlassCard style={styles.nutritionCard}>
              <View style={[styles.nutritionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.nutritionEmoji}>🍬</Text>
              </View>
              <Text style={[styles.nutritionTitle, { color: colors.textSecondary }]}>Sugar</Text>
              <Text style={[styles.nutritionValue, { color: ratingColor }]}>
                {product.nutritionFacts.sugar.toFixed(1)}
              </Text>
              <Text style={[styles.nutritionUnit, { color: colors.textTertiary }]}>g</Text>
            </GlassCard>
            
            <GlassCard style={styles.nutritionCard}>
              <View style={[styles.nutritionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.nutritionEmoji}>🥑</Text>
              </View>
              <Text style={[styles.nutritionTitle, { color: colors.textSecondary }]}>Fat</Text>
              <Text style={[styles.nutritionValue, { color: '#10B981' }]}>
                {product.nutritionFacts.fat.toFixed(1)}
              </Text>
              <Text style={[styles.nutritionUnit, { color: colors.textTertiary }]}>g</Text>
            </GlassCard>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients</Text>
          <GlassCard style={styles.ingredientsCard}>
            {product.ingredients ? (
              (() => {
                const ingredientsList = product.ingredients
                  .split(/[,\n]/)
                  .map(ing => ing.trim())
                  .filter(ing => ing.length > 0);
                
                if (ingredientsList.length === 0) {
                  return <Text style={[styles.ingredientsText, { color: colors.textSecondary }]}>Ingredients not available</Text>;
                }
                
                return (
                  <View>
                    {ingredientsList.map((ingredient, index) => (
                      <View key={index} style={styles.ingredientRow}>
                        <View style={[styles.ingredientBullet, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.ingredientText, { color: colors.textSecondary }]}>
                          {ingredient}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })()
            ) : (
              <Text style={[styles.ingredientsText, { color: colors.textSecondary }]}>
                Ingredients not available
              </Text>
            )}
          </GlassCard>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <GlassCard style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Text style={styles.explanationIcon}>💡</Text>
              <Text style={[styles.explanationTitle, { color: colors.text }]}>AI Analysis</Text>
            </View>
            <Text style={[styles.explanationText, { color: colors.textSecondary }]}>{aiExplanation}</Text>
          </GlassCard>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {!saved ? (
            <GradientButton
              title="Save to History"
              onPress={handleSaveToHistory}
              variant="primary"
              size="large"
              fullWidth
              icon={<Text>💾</Text>}
            />
          ) : (
            <View style={[styles.savedBanner, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.savedIcon}>✓</Text>
              <Text style={[styles.savedText, { color: colors.primary }]}>Saved to history</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingCard: {
    width: '100%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  errorIcon: {
    fontSize: 44,
  },
  errorText: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  errorButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  imageGradient: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.md,
  },
  imageContainer: {
    width: 180,
    height: 180,
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  placeholderIcon: {
    fontSize: 64,
  },
  productName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  productBrand: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  healthBadge: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  healthBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthBadgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  healthBadgeEmoji: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  healthBadgeTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  healthBadgeSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  servingSize: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  nutritionCard: {
    width: '47%',
    alignItems: 'center',
    padding: SPACING.md,
  },
  nutritionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  nutritionEmoji: {
    fontSize: 22,
  },
  nutritionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  nutritionValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  nutritionUnit: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  explanationCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  ingredientsCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  ingredientsText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
    paddingVertical: 2,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: SPACING.sm,
  },
  ingredientText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    flex: 1,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  explanationIcon: {
    fontSize: 22,
  },
  explanationTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  explanationText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 26,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  savedIcon: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#10B981',
  },
  savedText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
