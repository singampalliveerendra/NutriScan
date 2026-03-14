import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/constants';
import { Button, RatingBadge, NutritionCard } from '../../src/components';
import { useApp } from '../../src/context/AppContext';
import { Product } from '../../src/types';
import { calculateHealthRating, generateAIExplanation, getRatingColor } from '../../src/utils';
import { fetchProductByBarcode, saveScanRecord, ManualProductRequiredError } from '../../src/services/foodApi';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id, product: productParam } = useLocalSearchParams<{
    id: string;
    product?: string;
  }>();
  const { addToHistory, state } = useApp();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!productParam);
  const [saved, setSaved] = useState(false);

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
        Alert.alert('Product Not Found', 'We couldn\'t find this product yet. Try manual search or scan a different barcode.');
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Text style={styles.errorIcon}>🔍</Text>
        </View>
        <Text style={styles.errorText}>Product not found</Text>
        <Text style={styles.errorSubtext}>We couldn't find this product yet</Text>
        <View style={styles.errorButtons}>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            style={styles.errorButton}
          />
          <Button
            title="Search"
            onPress={() => router.push('/search')}
            variant="primary"
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  const rating = calculateHealthRating(product.nutritionFacts);
  const aiExplanation = generateAIExplanation(product.nutritionFacts, rating);
  const ratingColor = getRatingColor(rating);

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.productImage}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderIcon}>📦</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.productName}>{product.name}</Text>
          {product.brand && (
            <Text style={styles.productBrand}>{product.brand}</Text>
          )}
        </View>

        <View style={[styles.healthBadge, { backgroundColor: ratingColor + '15' }]}>
          <View style={[styles.healthBadgeIcon, { backgroundColor: ratingColor }]}>
            <Text style={styles.healthBadgeEmoji}>
              {rating === 'healthy' ? '✓' : rating === 'moderate' ? '⚠' : '✕'}
            </Text>
          </View>
          <View style={styles.healthBadgeContent}>
            <Text style={[styles.healthBadgeTitle, { color: ratingColor }]}>
              {rating === 'healthy' ? 'Healthy Choice!' : rating === 'moderate' ? 'Moderate' : 'Best to Avoid'}
            </Text>
            <Text style={styles.healthBadgeSubtitle}>
              Based on sugar, sodium & saturated fat
            </Text>
          </View>
        </View>

        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nutrition Facts</Text>
          <Text style={styles.servingSize}>Per 100g serving</Text>
          
          <View style={styles.nutritionGrid}>
            <NutritionCard
              title="Calories"
              value={product.nutritionFacts.calories}
              unit="kcal"
              icon="🔥"
              color={COLORS.secondary}
              size="medium"
              style={styles.nutritionCard}
            />
            <NutritionCard
              title="Protein"
              value={product.nutritionFacts.protein}
              unit="g"
              icon="💪"
              color={COLORS.primary}
              size="medium"
              style={styles.nutritionCard}
            />
            <NutritionCard
              title="Sugar"
              value={product.nutritionFacts.sugar}
              unit="g"
              icon="🍬"
              color={ratingColor}
              size="medium"
              style={styles.nutritionCard}
            />
            <NutritionCard
              title="Fat"
              value={product.nutritionFacts.fat}
              unit="g"
              icon="🥑"
              color={COLORS.warning}
              size="medium"
              style={styles.nutritionCard}
            />
          </View>
        </View>

        <View style={styles.explanationSection}>
          <View style={styles.explanationHeader}>
            <Text style={styles.explanationIcon}>💡</Text>
            <Text style={styles.sectionTitle}>AI Analysis</Text>
          </View>
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>{aiExplanation}</Text>
          </View>
        </View>

        {!saved ? (
          <View style={styles.actionSection}>
            <Button
              title="Save to History"
              onPress={handleSaveToHistory}
              variant="primary"
              size="large"
              fullWidth
              icon={<Text style={styles.buttonIcon}>💾</Text>}
            />
          </View>
        ) : (
          <View style={styles.savedBanner}>
            <Text style={styles.savedIcon}>✓</Text>
            <Text style={styles.savedText}>Saved to history</Text>
          </View>
        )}
      </ScrollView>
    </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  errorButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  errorButton: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  imageContainer: {
    width: 180,
    height: 180,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...SHADOWS.medium,
    marginBottom: SPACING.md,
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
    backgroundColor: COLORS.surfaceAlt,
  },
  placeholderIcon: {
    fontSize: 64,
  },
  productName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  productBrand: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  healthBadgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  healthBadgeEmoji: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: '800',
  },
  healthBadgeContent: {
    flex: 1,
  },
  healthBadgeTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  healthBadgeSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  nutritionSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  servingSize: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  nutritionCard: {
    width: '47%',
  },
  explanationSection: {
    marginBottom: SPACING.lg,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  explanationIcon: {
    fontSize: 24,
  },
  explanationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  explanationText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  actionSection: {
    marginBottom: SPACING.md,
  },
  buttonIcon: {
    fontSize: 18,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  savedIcon: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.primary,
    fontWeight: '800',
  },
  savedText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
