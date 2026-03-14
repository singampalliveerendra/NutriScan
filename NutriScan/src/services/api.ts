import { Product, ProductApiResponse, NutritionFacts } from '../types';

const BASE_URL = 'https://world.openfoodfacts.org/api/v2';

function parseNutritionFacts(nutriments: ProductApiResponse['product']['nutriments']): NutritionFacts {
  return {
    calories: nutriments['energy-kcal_100g'] ?? 0,
    protein: nutriments['proteins_100g'] ?? 0,
    carbohydrates: nutriments['carbohydrates_100g'] ?? 0,
    fat: nutriments['fat_100g'] ?? 0,
    sugar: nutriments['sugars_100g'] ?? 0,
    sodium: (nutriments['sodium_100g'] ?? 0) * 1000,
    saturatedFat: nutriments['saturated-fat_100g'] ?? 0,
    fiber: nutriments['fiber_100g'],
  };
}

export async function fetchProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const response = await fetch(`${BASE_URL}/product/${barcode}.json`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data: ProductApiResponse = await response.json();
    
    if (data.status !== 1 || !data.product) {
      return null;
    }
    
    const productData = data.product;
    
    return {
      id: data.code,
      barcode: data.code,
      name: productData.product_name || 'Unknown Product',
      brand: productData.brands,
      imageUrl: productData.image_front_url || productData.image_url,
      nutritionFacts: parseNutritionFacts(productData.nutriments),
      ingredients: productData.ingredients_text,
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export interface SearchResult {
  products: Product[];
  count: number;
}

export async function searchProducts(query: string, page: number = 1): Promise<SearchResult> {
  try {
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&page=${page}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      return { products: [], count: 0 };
    }
    
    const products: Product[] = data.products
      .filter((p: ProductApiResponse['product']) => p.product_name)
      .map((p: ProductApiResponse['product']) => ({
        id: p.product_name?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(),
        barcode: '',
        name: p.product_name || 'Unknown Product',
        brand: p.brands,
        imageUrl: p.image_front_url || p.image_url,
        nutritionFacts: parseNutritionFacts(p.nutriments),
        ingredients: p.ingredients_text,
      }));
    
    return {
      products,
      count: data.count || products.length,
    };
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}
