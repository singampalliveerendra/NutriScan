import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../src/constants';
import { SearchBar } from '../src/components';
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
    
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleProductPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${getRatingLabel(rating)} rating`}
      >
        <View style={styles.itemImageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
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
            {item.name}
          </Text>
          {item.brand && (
            <Text style={styles.itemBrand} numberOfLines={1}>
              {item.brand}
            </Text>
          )}
          <View style={styles.itemNutrition}>
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
        <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(rating) }]}>
          <Text style={styles.ratingText}>{getRatingLabel(rating)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={handleQueryChange}
          onSubmit={() => handleSearch(query)}
          placeholder="Search for food products..."
          autoFocus
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>
            Try searching with different keywords
          </Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🍎</Text>
          <Text style={styles.emptyText}>Search for food</Text>
          <Text style={styles.emptySubtext}>
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
    backgroundColor: COLORS.background,
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
    paddingTop: 0,
  },
  resultItem: {
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
  itemNutrition: {
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'center',
  },
  ratingText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.error,
    textAlign: 'center',
  },
});
