import { Platform } from 'react-native';
import { Product, NutritionFacts } from '../types';

const isWeb = Platform.OS === 'web';

let db: any = null;

async function loadSQLite() {
  if (!db && !isWeb) {
    const SQLiteModule = await import('expo-sqlite');
    db = await SQLiteModule.openDatabaseAsync('nutriscan.db');
  }
}

const webStorage: Map<string, unknown> = new Map();

async function webExecAsync(sql: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 10));
}

async function webRunAsync(sql: string, params: unknown[] = []): Promise<void> {
  const key = sql.includes('INSERT') ? 'insert' : 'update';
  webStorage.set(key, { sql, params, timestamp: Date.now() });
  await new Promise(resolve => setTimeout(resolve, 10));
}

async function webGetFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  await new Promise(resolve => setTimeout(resolve, 10));
  return null;
}

async function webGetAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  await new Promise(resolve => setTimeout(resolve, 10));
  return [];
}

export async function initDatabase(): Promise<void> {
  if (isWeb) {
    console.log('[Database] Running in web mode - SQLite not available');
    return;
  }
  
  if (db) return;
  
  await loadSQLite();
  
  const database = db;
  if (!database) return;
  
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      barcode TEXT PRIMARY KEY,
      product_name TEXT NOT NULL,
      brand TEXT,
      calories REAL DEFAULT 0,
      protein REAL DEFAULT 0,
      carbohydrates REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      sugar REAL DEFAULT 0,
      sodium REAL DEFAULT 0,
      saturated_fat REAL DEFAULT 0,
      fiber REAL DEFAULT 0,
      ingredients TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT NOT NULL,
      product_name TEXT NOT NULL,
      verdict TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  if (isWeb) return null;
  
  if (!db) await initDatabase();
  
  const result = await db!.getFirstAsync<{
    barcode: string;
    product_name: string;
    brand: string | null;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    sugar: number;
    sodium: number;
    saturated_fat: number;
    fiber: number;
    ingredients: string | null;
    image_url: string | null;
  }>('SELECT * FROM products WHERE barcode = ?', [barcode]);
  
  if (!result) return null;
  
  return {
    id: result.barcode,
    barcode: result.barcode,
    name: result.product_name,
    brand: result.brand || undefined,
    imageUrl: result.image_url || undefined,
    nutritionFacts: {
      calories: result.calories,
      protein: result.protein,
      carbohydrates: result.carbohydrates,
      fat: result.fat,
      sugar: result.sugar,
      sodium: result.sodium,
      saturatedFat: result.saturated_fat,
      fiber: result.fiber || undefined,
    },
    ingredients: result.ingredients || undefined,
  };
}

export async function saveProduct(product: Product): Promise<void> {
  if (isWeb) return;
  
  if (!db) await initDatabase();
  
  await db!.runAsync(
    `INSERT OR REPLACE INTO products 
     (barcode, product_name, brand, calories, protein, carbohydrates, fat, sugar, sodium, saturated_fat, fiber, ingredients, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.barcode,
      product.name,
      product.brand || null,
      product.nutritionFacts.calories,
      product.nutritionFacts.protein,
      product.nutritionFacts.carbohydrates,
      product.nutritionFacts.fat,
      product.nutritionFacts.sugar,
      product.nutritionFacts.sodium,
      product.nutritionFacts.saturatedFat,
      product.nutritionFacts.fiber || 0,
      product.ingredients || null,
      product.imageUrl || null,
    ]
  );
}

export async function saveScanHistory(
  barcode: string,
  productName: string,
  verdict: string
): Promise<void> {
  if (isWeb) return;
  
  if (!db) await initDatabase();
  
  await db!.runAsync(
    'INSERT INTO scan_history (barcode, product_name, verdict) VALUES (?, ?, ?)',
    [barcode, productName, verdict]
  );
}

export async function getScanHistory(limit: number = 50): Promise<Array<{
  id: number;
  barcode: string;
  product_name: string;
  verdict: string;
  created_at: string;
}>> {
  if (isWeb) return [];
  
  if (!db) await initDatabase();
  
  return await db!.getAllAsync(
    'SELECT * FROM scan_history ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
}

export async function searchProductsLocal(query: string): Promise<Product[]> {
  if (isWeb) return [];
  
  if (!db) await initDatabase();
  
  const results = await db!.getAllAsync<{
    barcode: string;
    product_name: string;
    brand: string | null;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    sugar: number;
    sodium: number;
    saturated_fat: number;
    fiber: number;
    ingredients: string | null;
    image_url: string | null;
  }>(
    'SELECT * FROM products WHERE product_name LIKE ? LIMIT 20',
    [`%${query}%`]
  );
  
  return results.map(r => ({
    id: r.barcode,
    barcode: r.barcode,
    name: r.product_name,
    brand: r.brand || undefined,
    imageUrl: r.image_url || undefined,
    nutritionFacts: {
      calories: r.calories,
      protein: r.protein,
      carbohydrates: r.carbohydrates,
      fat: r.fat,
      sugar: r.sugar,
      sodium: r.sodium,
      saturatedFat: r.saturated_fat,
      fiber: r.fiber || undefined,
    },
    ingredients: r.ingredients || undefined,
  }));
}

export async function getAllLocalProducts(): Promise<Product[]> {
  if (isWeb) return [];
  
  if (!db) await initDatabase();
  
  const results = await db!.getAllAsync<{
    barcode: string;
    product_name: string;
    brand: string | null;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    sugar: number;
    sodium: number;
    saturated_fat: number;
    fiber: number;
    ingredients: string | null;
    image_url: string | null;
  }>('SELECT * FROM products ORDER BY product_name');
  
  return results.map(r => ({
    id: r.barcode,
    barcode: r.barcode,
    name: r.product_name,
    brand: r.brand || undefined,
    imageUrl: r.image_url || undefined,
    nutritionFacts: {
      calories: r.calories,
      protein: r.protein,
      carbohydrates: r.carbohydrates,
      fat: r.fat,
      sugar: r.sugar,
      sodium: r.sodium,
      saturatedFat: r.saturated_fat,
      fiber: r.fiber || undefined,
    },
    ingredients: r.ingredients || undefined,
  }));
}