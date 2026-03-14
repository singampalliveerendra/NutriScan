export interface NutritionFacts {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
  fiber?: number;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  nutritionFacts: NutritionFacts;
  ingredients?: string;
}

export interface ScanHistoryItem {
  id: string;
  product: Product;
  scannedAt: string;
  verdict?: 'healthy' | 'moderate' | 'avoid';
}

export type HealthRating = 'healthy' | 'moderate' | 'avoid';

export interface ProductApiResponse {
  code: string;
  product: {
    product_name?: string;
    brands?: string;
    image_url?: string;
    image_front_url?: string;
    ingredients_text?: string;
    nutriments: {
      'energy-kcal_100g'?: number;
      'proteins_100g'?: number;
      'carbohydrates_100g'?: number;
      'fat_100g'?: number;
      'sugars_100g'?: number;
      'sodium_100g'?: number;
      'saturated-fat_100g'?: number;
      'fiber_100g'?: number;
    };
  };
  status: number;
}

export interface ManualProductInput {
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
  fiber?: number;
  ingredients?: string;
}