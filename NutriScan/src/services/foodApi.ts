import { Product, NutritionFacts } from '../types';
import { 
  initDatabase, 
  getProductByBarcode, 
  saveProduct, 
  saveScanHistory,
  searchProductsLocal 
} from './databaseService';
import { searchIndianFoods, getAllIndianFoods } from '../data/indianFoods';
import { cacheService } from './cacheService';

function parseNutritionFacts(nutriments: Record<string, unknown> | undefined): NutritionFacts {
  if (!nutriments) {
    return {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      sugar: 0,
      sodium: 0,
      saturatedFat: 0,
      fiber: 0,
    };
  }

  return {
    calories: typeof nutriments['energy-kcal_100g'] === 'number' ? nutriments['energy-kcal_100g'] : 0,
    protein: typeof nutriments['proteins_100g'] === 'number' ? nutriments['proteins_100g'] : 0,
    carbohydrates: typeof nutriments['carbohydrates_100g'] === 'number' ? nutriments['carbohydrates_100g'] : 0,
    fat: typeof nutriments['fat_100g'] === 'number' ? nutriments['fat_100g'] : 0,
    sugar: typeof nutriments['sugars_100g'] === 'number' ? nutriments['sugars_100g'] : 0,
    sodium: typeof nutriments['sodium_100g'] === 'number' ? nutriments['sodium_100g'] * 1000 : 0,
    saturatedFat: typeof nutriments['saturated-fat_100g'] === 'number' ? nutriments['saturated-fat_100g'] : 0,
    fiber: typeof nutriments['fiber_100g'] === 'number' ? nutriments['fiber_100g'] : 0,
  };
}

export interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_size: number;
  products: Array<{
    code?: string;
    product_name?: string;
    brands?: string;
    image_url?: string;
    image_front_url?: string;
    image_small_url?: string;
    ingredients_text?: string;
    nutriments?: Record<string, unknown>;
  }>;
}

export interface OpenFoodFactsProductResponse {
  status: number;
  status_verbose?: string;
  code: string;
  product?: {
    product_name?: string;
    brands?: string;
    image_url?: string;
    image_front_url?: string;
    image_small_url?: string;
    ingredients_text?: string;
    nutriments?: Record<string, unknown>;
  };
}

export interface UPCItemDBResponse {
  code: string;
  total_matches: number;
  items: Array<{
    title: string;
    brand?: string;
    images?: string[];
    upc?: string;
    ean?: string;
  }>;
}

export interface SearchResult {
  products: Product[];
  count: number;
}

export class ProductNotFoundError extends Error {
  constructor(message = 'Product not found in database') {
    super(message);
    this.name = 'ProductNotFoundError';
  }
}

export class ManualProductRequiredError extends Error {
  constructor(message = 'Product not found. Please add manually.') {
    super(message);
    this.name = 'ManualProductRequiredError';
  }
}

let dbInitialized = false;

async function ensureDbInitialized(): Promise<void> {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

export async function fetchProductByBarcode(barcode: string): Promise<Product> {
  console.log('[FoodApi] ========== fetchProductByBarcode START ==========');
  console.log('[FoodApi] Input barcode:', barcode);
  
  if (!barcode || !barcode.trim()) {
    console.log('[FoodApi] Invalid barcode - empty or whitespace only');
    throw new ManualProductRequiredError('Invalid barcode');
  }

  const cleanBarcode = barcode.trim();
  console.log('[FoodApi] Cleaned barcode:', cleanBarcode);

  console.log('[FoodApi] Checking local database...');
  await ensureDbInitialized();

  const localProduct = await getProductByBarcode(cleanBarcode);
  if (localProduct) {
    console.log('[FoodApi] Product found in LOCAL database:', localProduct.name);
    return localProduct;
  }
  console.log('[FoodApi] Product NOT in local database');

  try {
    const openFoodFactsUrl = `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`;
    console.log('[FoodApi] === Making OpenFoodFacts API request ===');
    console.log('[FoodApi] URL:', openFoodFactsUrl);
    console.log('[FoodApi] Barcode:', cleanBarcode);
    
    const response = await fetch(openFoodFactsUrl);
    console.log('[FoodApi] Response status:', response.status);
    console.log('[FoodApi] Response ok:', response.ok);
    
    if (!response.ok) {
      console.log('[FoodApi] Network error - response not ok');
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data: OpenFoodFactsProductResponse = await response.json();
    console.log('[FoodApi] Raw API response:', JSON.stringify(data));
    console.log('[FoodApi] Response status field:', data.status);
    console.log('[FoodApi] Response code field:', data.code);
    
    if (data.status === 1 && data.product) {
      console.log('[FoodApi] Product found in Open Food Facts - status=1');
      const productData = data.product;
      
      const product: Product = {
        id: data.code,
        barcode: data.code,
        name: productData.product_name || 'Unknown Product',
        brand: productData.brands,
        imageUrl: productData.image_front_url || productData.image_small_url || productData.image_url,
        nutritionFacts: parseNutritionFacts(productData.nutriments),
        ingredients: productData.ingredients_text,
      };
      
      console.log('[FoodApi] Parsed product:', JSON.stringify(product));
      
      await saveProduct(product);
      
      return product;
    } else if (data.status === 0) {
      console.log('[FoodApi] Product NOT found in Open Food Facts - status=0');
      console.log('[FoodApi] Status verbose:', data.status_verbose);
    } else {
      console.log('[FoodApi] Unexpected status:', data.status);
    }
  } catch (error) {
    console.log('[FoodApi] OpenFoodFacts lookup failed:', error);
    console.log('[FoodApi] Trying backup UPCItemDB API...');
  }

  try {
    console.log('[FoodApi] === Trying backup UPCItemDB API ===');
    const upcItemDbUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${cleanBarcode}`;
    console.log('[FoodApi] Backup API URL:', upcItemDbUrl);
    
    const response = await fetch(upcItemDbUrl);
    console.log('[FoodApi] Backup API response status:', response.status);

    if (!response.ok) {
      console.log('[FoodApi] Backup API error - response not ok');
    } else if (response.ok) {
      const data: UPCItemDBResponse = await response.json();
      console.log('[FoodApi] Backup API response:', JSON.stringify(data));
      console.log('[FoodApi] Total matches:', data.total_matches);
      
      if (data.total_matches > 0 && data.items && data.items.length > 0) {
        console.log('[FoodApi] Product found in UPCItemDB');
        const item = data.items[0];
        
        const product: Product = {
          id: item.upc || item.ean || cleanBarcode,
          barcode: cleanBarcode,
          name: item.title || 'Unknown Product',
          brand: item.brand,
          imageUrl: item.images && item.images.length > 0 ? item.images[0] : undefined,
          nutritionFacts: {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            sugar: 0,
            sodium: 0,
            saturatedFat: 0,
            fiber: 0,
          },
          ingredients: undefined,
        };
        
        console.log('[FoodApi] Backup product created:', product.name);
        return product;
      } else {
        console.log('[FoodApi] No matches in UPCItemDB');
      }
    }
  } catch (error) {
    console.log('[FoodApi] UPCItemDB lookup failed:', error);
  }

  console.log('[FoodApi] === Product not found in any database ===');
  console.log('[FoodApi] Throwing ManualProductRequiredError');
  throw new ManualProductRequiredError('Product not found in database. Please add manually or search.');
}

export async function addManualProduct(
  name: string,
  brand: string,
  nutritionFacts: NutritionFacts,
  ingredients?: string
): Promise<Product> {
  await ensureDbInitialized();
  
  const barcode = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const product: Product = {
    id: barcode,
    barcode,
    name,
    brand,
    nutritionFacts,
    ingredients,
  };
  
  await saveProduct(product);
  
  return product;
}

const INDIAN_KEYWORDS = [
  'maggi', 'lays', 'kurkure', 'parle', 'good day', 'dairy milk', 'bourbon',
  'thums up', 'maaza', 'frooti', 'bournvita', 'horlicks', 'complan', 'boost',
  'amul', 'haldiram', 'balaji', 'unibic', 'sunfeast', 'bingo', 'patanjali',
  'coca cola', 'pepsi', 'sprite', 'frooti', '7up', 'mirinda', 'mountain dew',
  'monster', 'red bull', 'maza', 'coke', 'indian', 'namkeen', 'bhujia',
  'chai', 'lassi', 'chai', 'masala', 'noodles', 'chips', 'biscuit', 'wafer'
];

function isIndianQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return INDIAN_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
}

export async function searchProducts(query: string, page: number = 1): Promise<SearchResult> {
  if (!query.trim()) {
    return { products: [], count: 0 };
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  const cachedResults = cacheService.getSearch(normalizedQuery);
  if (cachedResults) {
    return { products: cachedResults, count: cachedResults.length };
  }

  const localResults = await searchProductsLocal(normalizedQuery);
  
  const indianFoodResults = searchIndianFoods(normalizedQuery);
  
  let openFoodFactsProducts: Product[] = [];
  
  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodedQuery}&search_simple=1&action=process&json=1&page_size=30&page=${page}`;
    
    const response = await fetch(searchUrl);
    
    if (response.ok) {
      const data: OpenFoodFactsSearchResponse = await response.json();
      
      if (data.products && data.products.length > 0) {
        openFoodFactsProducts = data.products
          .filter((p) => p.product_name && p.product_name.length > 0)
          .map((p) => ({
            id: p.code || p.product_name?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(),
            barcode: p.code || '',
            name: p.product_name || 'Unknown Product',
            brand: p.brands,
            imageUrl: p.image_front_url || p.image_small_url || p.image_url,
            nutritionFacts: parseNutritionFacts(p.nutriments),
            ingredients: p.ingredients_text,
          }));
      }
    }
  } catch (error) {
    console.log('Open Food Facts search failed:', error);
  }

  let allProducts: Product[];
  
  if (isIndianQuery(query) || openFoodFactsProducts.length === 0) {
    allProducts = [...indianFoodResults, ...openFoodFactsProducts, ...localResults];
  } else {
    allProducts = [...openFoodFactsProducts, ...indianFoodResults, ...localResults];
  }
  
  const uniqueProducts = allProducts.filter((product, index, self) => 
    index === self.findIndex(p => 
      (p.name && product.name && p.name.toLowerCase() === product.name.toLowerCase()) ||
      p.id === product.id || 
      p.barcode === product.barcode
    )
  );

  cacheService.setSearch(normalizedQuery, uniqueProducts);

  return {
    products: uniqueProducts,
    count: uniqueProducts.length,
  };
}

export async function saveScanRecord(
  barcode: string,
  productName: string,
  verdict: 'healthy' | 'moderate' | 'avoid'
): Promise<void> {
  await ensureDbInitialized();
  await saveScanHistory(barcode, productName, verdict);
}