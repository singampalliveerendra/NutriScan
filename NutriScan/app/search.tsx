import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../src/constants';
import { AnimatedWrapper, SkeletonCard } from '../src/components';
import { searchProducts, ProductNotFoundError } from '../src/services/foodApi';
import { Product } from '../src/types';
import { calculateHealthRating, getRatingLabel, getRatingColor } from '../src/utils';
import { getAllIndianFoods } from '../src/data/indianFoods';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIndianFallback, setShowIndianFallback] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      setShowIndianFallback(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError(null);
    setShowIndianFallback(false);

    try {
      const data = await searchProducts(searchQuery);
      
      if (data.products.length === 0) {
        const allIndianFoods = getAllIndianFoods();
        const queryLower = searchQuery.toLowerCase().trim();
        const matchingIndianFoods = allIndianFoods.filter(food => 
          food.name.toLowerCase().includes(queryLower) ||
          food.name.toLowerCase().split(' ').some(word => word.includes(queryLower))
        );
        
        if (matchingIndianFoods.length > 0) {
          setResults(matchingIndianFoods);
        } else {
          setResults(allIndianFoods.slice(0, 10));
          setShowIndianFallback(true);
        }
      } else {
        setResults(data.products);
      }
    } catch (err) {
      console.error('Search error:', err);
      const allIndianFoods = getAllIndianFoods();
      const queryLower = searchQuery.toLowerCase().trim();
      const matchingIndianFoods = allIndianFoods.filter(food => 
        food.name.toLowerCase().includes(queryLower)
      );
      
      if (matchingIndianFoods.length > 0) {
        setResults(matchingIndianFoods);
      } else {
        setResults(allIndianFoods.slice(0, 10));
        setShowIndianFallback(true);
      }
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
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (text.trim().length >= 2) {
        handleSearch(text);
      } else if (text.trim().length === 0) {
        setResults([]);
        setHasSearched(false);
        setShowIndianFallback(false);
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const renderItem = ({ item, index }: { item: Product; index: number }) => {
    const rating = calculateHealthRating(item.nutritionFacts);
    const ratingColor = getRatingColor(rating);
    
    return (
      <AnimatedWrapper animationType="slideUp" delay={index * 50}>
        <TouchableOpacity
          style={styles.resultCard}
          onPress={() => handleProductPress(item)}
          activeOpacity={0.9}
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
      </AnimatedWrapper>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Searching...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.stateContainer}>
      <AnimatedWrapper animationType="scale">
        <View style={styles.stateIconContainer}>
          <Text style={styles.stateIcon}>🔍</Text>
        </View>
      </AnimatedWrapper>
      <AnimatedWrapper animationType="fadeIn" delay={200}>
        <Text style={styles.stateTitle}>Search for food</Text>
      </AnimatedWrapper>
      <AnimatedWrapper animationType="fadeIn" delay={300}>
        <Text style={styles.stateSubtext}>
          Find nutritional information for thousands of products
        </Text>
      </AnimatedWrapper>
    </View>
  );

  const renderNoResults = () => (
    <AnimatedWrapper animationType="fadeIn">
      <View style={styles.stateContainer}>
        <View style={styles.stateIconContainer}>
          <Text style={styles.stateIcon}>😕</Text>
        </View>
        <Text style={styles.stateTitle}>No results found</Text>
        <Text style={styles.stateSubtext}>
          Try searching with different keywords
        </Text>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => router.push('/scanner')}
        >
          <Text style={styles.scanButtonText}>Scan Instead</Text>
        </TouchableOpacity>
      </View>
    </AnimatedWrapper>
  );

  const renderError = () => (
    <AnimatedWrapper animationType="fadeIn">
      <View style={styles.stateContainer}>
        <View style={[styles.stateIconContainer, { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.stateIcon}>⚠️</Text>
        </View>
        <Text style={styles.stateTitle}>Oops!</Text>
        <Text style={styles.stateSubtext}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => handleSearch(query)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </AnimatedWrapper>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <AnimatedWrapper animationType="slideDown">
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
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </AnimatedWrapper>
        
        {query.length > 0 && query.length < 2 && (
          <Text style={styles.hintText}>Type at least 2 characters to search</Text>
        )}
      </View>

      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : hasSearched && results.length === 0 ? (
        renderNoResults()
      ) : !hasSearched ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsHeaderText}>
                Showing results for: "{query}"
              </Text>
              {showIndianFallback && (
                <Text style={styles.fallbackText}>
                  Showing popular Indian foods as fallback
                </Text>
              )}
              <Text style={styles.resultsCount}>
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          }
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
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearIcon: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  hintText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
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
    width: 76,
    height: 76,
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
    fontSize: 32,
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
    paddingVertical: SPACING.xxl,
  },
  stateIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  stateIcon: {
    fontSize: 44,
  },
  stateTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  stateSubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
  },
  scanButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
  },
  retryButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  resultsHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  resultsHeaderText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fallbackText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  resultsCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
