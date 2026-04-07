export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
  images?: string[];
  rating?: number;
  reviews?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  _id: string;
  customerName: string;
  email: string;
  products: { productName: string; quantity: number; priceAtPurchase: number }[];
  status: 'Unfulfilled' | 'In Progress' | 'Fulfilled';
  orderTotal: number;
  paymentMethod: string;
  createdAt: string;
  shippingCost: number;
}

export interface NepalWardRow {
  province_en: string;
  district_en: string;
  municipality_en: string;
  ward_en: string;
  province_np?: string;
  district_np?: string;
  municipality_np?: string;
  ward_np?: string;
}

export const SORT_OPTIONS = [
  { key: 'alpha-asc', label: 'Alphabet A-Z' },
  { key: 'alpha-desc', label: 'Alphabet Z-A' },
  { key: 'price-asc', label: 'Price low to high' },
  { key: 'price-desc', label: 'Price high to low' },
  { key: 'date-asc', label: 'Date old to new' },
  { key: 'date-desc', label: 'Date new to old' },
] as const;

export const SHIPPING = 100;

export const NEPAL_WARD_ROWS: NepalWardRow[] = require('@/assets/nepal-ward-level-full.json');