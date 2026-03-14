import { Product } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000;

class CacheService {
  private barcodeCache: Map<string, CacheEntry<Product>> = new Map();
  private searchCache: Map<string, CacheEntry<Product[]>> = new Map();
  private pendingBarcodeRequests: Map<string, Promise<Product>> = new Map();
  private pendingSearchRequests: Map<string, Promise<Product[]>> = new Map();

  getBarcode(barcode: string): Product | null {
    const entry = this.barcodeCache.get(barcode);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.barcodeCache.delete(barcode);
      return null;
    }
    
    return entry.data;
  }

  setBarcode(barcode: string, product: Product): void {
    this.barcodeCache.set(barcode, {
      data: product,
      timestamp: Date.now(),
    });
  }

  getSearch(query: string): Product[] | null {
    const normalizedQuery = query.toLowerCase().trim();
    const entry = this.searchCache.get(normalizedQuery);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.searchCache.delete(normalizedQuery);
      return null;
    }
    
    return entry.data;
  }

  setSearch(query: string, products: Product[]): void {
    const normalizedQuery = query.toLowerCase().trim();
    this.searchCache.set(normalizedQuery, {
      data: products,
      timestamp: Date.now(),
    });
  }

  getPendingBarcode(barcode: string): Promise<Product> | undefined {
    return this.pendingBarcodeRequests.get(barcode);
  }

  setPendingBarcode(barcode: string, promise: Promise<Product>): void {
    this.pendingBarcodeRequests.set(barcode, promise);
    promise.finally(() => {
      this.pendingBarcodeRequests.delete(barcode);
    });
  }

  getPendingSearch(query: string): Promise<Product[]> | undefined {
    return this.pendingSearchRequests.get(query.toLowerCase().trim());
  }

  setPendingSearch(query: string, promise: Promise<Product[]>): void {
    const normalizedQuery = query.toLowerCase().trim();
    this.pendingSearchRequests.set(normalizedQuery, promise);
    promise.finally(() => {
      this.pendingSearchRequests.delete(normalizedQuery);
    });
  }

  clearCache(): void {
    this.barcodeCache.clear();
    this.searchCache.clear();
  }

  getCacheStats(): { barcodeCount: number; searchCount: number } {
    return {
      barcodeCount: this.barcodeCache.size,
      searchCount: this.searchCache.size,
    };
  }
}

export const cacheService = new CacheService();
