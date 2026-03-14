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
import { Button, NutritionFactsTable, RatingBadge } from '../../src/components';
import { useApp } from '../../src/context/AppContext';
import { Product } from '../../src/types';
import { calculateHealthRating, generateAIExplanation, getRatingLabel } from '../../src/utils';
import { fetchProductByBarcode, saveScanRecord, ManualProductRequiredError } from '../../src/services/foodApi';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id, product: productParam, isSearch } = useLocalSearchParams<{
    id: string;
    product?: string;
    isSearch?: string;
  }>();
  const { addToHistory, state } = useApp();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!productParam);
  const [saved, setSaved] = useState(false);

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
        Alert.alert('Product Not Found', 'Product not found in database. Try manual search or add it manually.');
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
      
      Alert.alert('Saved', 'Product added to your history');
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
        <Text style={styles.errorIcon}>🔍</Text>
        <Text style={styles.errorText}>Product not found in database</Text>
        <Text style={styles.errorSubtext}>Try manual search or scan a different barcode</Text>
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

  return (
    <>
      <Stack.Screen options={{ title: product.name }} />
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
          
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.brand && (
              <Text style={styles.productBrand}>{product.brand}</Text>
            )}
            {product.barcode && (
              <Text style={styles.barcode}>Barcode: {product.barcode}</Text>
            )}
          </View>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Health Rating</Text>
          <View style={styles.ratingRow}>
            <RatingBadge rating={rating} size="large" />
            <Text style={styles.ratingDescription}>
              Based on sugar, sodium, and saturated fat content
            </Text>
          </View>
        </View>

        <View style={styles.explanationSection}>
          <Text style={styles.sectionTitle}>AI Analysis</Text>
          <View style={styles.explanationCard}>
            <Text style={styles.explanationIcon}>💡</Text>
            <Text style={styles.explanationText}>{aiExplanation}</Text>
          </View>
        </View>

        <View style={styles.nutritionSection}>
          <NutritionFactsTable nutrition={product.nutritionFacts} />
        </View>

        {!saved && (
          <View style={styles.actionSection}>
            <Button
              title="Save to History"
              onPress={handleSaveToHistory}
              variant="primary"
              size="large"
              icon={<Text style={styles.buttonIcon}>💾</Text>}
            />
          </View>
        )}

        {saved && (
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
    padding: SPACING.md,
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
  errorIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  errorButton: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...SHADOWS.medium,
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
  productInfo: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  productName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  productBrand: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  barcode: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  ratingSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  ratingDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  explanationSection: {
    marginBottom: SPACING.lg,
  },
  explanationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...SHADOWS.small,
  },
  explanationIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  explanationText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  nutritionSection: {
    marginBottom: SPACING.lg,
  },
  actionSection: {
    marginBottom: SPACING.lg,
  },
  buttonIcon: {
    fontSize: 18,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  savedIcon: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  },
  savedText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
