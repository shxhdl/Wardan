export type Language = 'ar' | 'en';
export type ThemeMode = 'light' | 'dark';

export type NavSection =
  | 'dashboard'
  | 'orders'
  | 'completed'
  | 'customers'
  | 'reports'
  | 'settings';

export type OrderStatus = 'preparing' | 'delivering' | 'completed';
export type PaymentStatus = 'paid' | 'unpaid';
export type FulfillmentType = 'pickup' | 'delivery';
export type StaffAccountStatus = 'approved' | 'pending' | 'rejected';

export interface Order {
  id: string; // e.g. "#W1287"
  customerNameAr: string;
  customerNameEn: string;
  customerPhone: string;
  orderTypeAr: string;
  orderTypeEn: string;
  thumbnail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  hasGiftCard: boolean;
  isCompleted: boolean;
  isUrgent?: boolean;
  fulfillmentType: FulfillmentType;
  pickupDate?: string; // YYYY-MM-DD for calendar input
  pickupTime?: string; // HH:mm for clock input
  deliveryTimeAr: string;
  deliveryTimeEn: string;
  deliveryAreaAr: string;
  deliveryAreaEn: string;
  amountOmr: number;
  cardMessageAr?: string;
  cardMessageEn?: string;
  floristAr: string;
  floristEn: string;
  notesAr?: string;
  notesEn?: string;
}

export interface QuickNote {
  id: string;
  textAr: string;
  textEn: string;
  completed: boolean;
}

export interface Customer {
  id: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  areaAr: string;
  areaEn: string;
  totalOrders: number;
  totalSpentOmr: number;
  tier: 'VIP' | 'Signature' | 'Regular';
  favoriteStyleAr: string;
  favoriteStyleEn: string;
  lastOrderDateAr: string;
  lastOrderDateEn: string;
}

export interface Product {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  priceOmr: number;
  image: string;
  flowersUsedAr: string;
  flowersUsedEn: string;
  inStock: boolean;
  featured?: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  category: 'flowers' | 'foliage' | 'vessels' | 'packaging';
  categoryAr: string;
  categoryEn: string;
  quantity: number;
  unitAr: string;
  unitEn: string;
  minThreshold: number;
  originAr: string;
  originEn: string;
  freshnessScore: number;
}

export interface StaffProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  email: string;
  phone?: string;
  avatar?: string;
  password: string;
  pin: string;
  status: StaffAccountStatus;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface NewOrderNotification {
  id: string;
  order: Order;
  createdAt: string;
  read: boolean;
}
