import { Product } from '../types';

export async function initDatabase(): Promise<void> {
  console.log('[Database] Web mode - using in-memory storage');
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  return null;
}

export async function saveProduct(product: Product): Promise<void> {
  console.log('[Database] saveProduct not available on web');
}

export async function saveScanHistory(
  barcode: string,
  productName: string,
  verdict: string
): Promise<void> {
  console.log('[Database] saveScanHistory not available on web');
}

export async function getScanHistory(limit: number = 50): Promise<Array<{
  id: number;
  barcode: string;
  product_name: string;
  verdict: string;
  created_at: string;
}>> {
  return [];
}

export async function searchProductsLocal(query: string): Promise<Product[]> {
  return [];
}

export async function getAllLocalProducts(): Promise<Product[]> {
  return [];
}
