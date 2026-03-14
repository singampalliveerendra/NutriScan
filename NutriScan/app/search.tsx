import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../src/constants';
import { searchProducts, ProductNotFoundError } from '../src/services/foodApi';
import { Product } from '../src/types';
import { calculateHealthRating, getRatingLabel, getRatingColor } from '../src/utils';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      const data = await searchProducts(searchQuery);
      setResults(data.products);
      if (data.products.length === 0) {
        setError('No products found. Try a different search term.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Check your internet connection.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProductPress = (product: Product) => {
    const barcode = product.barcode || product.id;
    router.push({
      pathname: '/product/[id]',
      params: { 
        id: encodeURIComponent(barcode), 
        product: JSON.stringify({ ...product, barcode }),
        isSearch: 'true'
      },
    });
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const renderItem = ({ item }: { item: Product }) => {
    const rating = calculateHealthRating(item.nutritionFacts);
    const ratingColor = getRatingColor(rating);
    
    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => handleProductPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${getRatingLabel(rating)} rating`}
      >
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderEmoji}>📦</Text>
              </View>
            )}
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.brand && (
              <Text style={styles.productBrand} numberOfLines={1}>
                {item.brand}
              </Text>
            )}
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionText}>
                {item.nutritionFacts.calories.toFixed(0)} kcal
              </Text>
              <Text style={styles.nutritionDot}>•</Text>
              <Text style={styles.nutritionText}>
                P: {item.nutritionFacts.protein.toFixed(1)}g
              </Text>
              <Text style={styles.nutritionDot}>•</Text>
              <Text style={styles.nutritionText}>
                C: {item.nutritionFacts.carbohydrates.toFixed(1)}g
              </Text>
            </View>
          </View>
          
          <View style={[styles.ratingBadge, { backgroundColor: ratingColor + '20' }]}>
            <View style={[styles.ratingDot, { backgroundColor: ratingColor }]} />
            <Text style={[styles.ratingText, { color: ratingColor }]}>
              {getRatingLabel(rating)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => handleSearch(query)}
            placeholder="Search for food products..."
            placeholderTextColor={COLORS.textLight}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <View style={styles.stateIconContainer}>
            <Text style={styles.stateIcon}>⚠️</Text>
          </View>
          <Text style={styles.stateTitle}>{error}</Text>
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.stateContainer}>
          <View style={styles.stateIconContainer}>
            <Text style={styles.stateIcon}>🔍</Text>
          </View>
          <Text style={styles.stateTitle}>No results found</Text>
          <Text style={styles.stateSubtext}>
            Try searching with different keywords
          </Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.stateContainer}>
          <View style={styles.stateIconContainer}>
            <Text style={styles.stateIcon}>🍎</Text>
          </View>
          <Text style={styles.stateTitle}>Search for food</Text>
          <Text style={styles.stateSubtext}>
            Find nutritional information for thousands of products
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
  clearIcon: {
    fontSize: 16,
    color: COLORS.textLight,
    padding: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
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
    backgroundColor: COLORS.surfaceAlt,
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
  infoContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  productName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    lineHeight: 20,
  },
  productBrand: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  nutritionDot: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginHorizontal: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  ratingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ratingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  stateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stateIcon: {
    fontSize: 40,
  },
  stateTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  stateSubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
