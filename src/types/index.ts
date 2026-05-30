export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  review_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  address: string;
  city: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  discount_amount: number;
  discount_code: string;
  shipping_address: string;
  shipping_city: string;
  shipping_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
  user?: User;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_ar: string;
  product_name_en: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image: string;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Discount {
  id: string;
  code: string;
  description_ar: string;
  description_en: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  product_ids: string[];
  category_ids: string[];
  scope: 'global' | 'products' | 'categories';
  auto_apply: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalDiscounts: number;
  avgOrderValue: number;
  revenueByPeriod: { period: string; revenue: number; orders: number; discounts: number }[];
  topProducts: { id: string; name_ar: string; name_en: string; quantity: number; revenue: number }[];
  lowestProducts: { id: string; name_ar: string; name_en: string; quantity: number; revenue: number }[];
  totalProductsSold: number;
  productRevenue: number;
  totalCustomers: number;
  customerGrowth: { period: string; count: number }[];
  uniqueBuyingCustomers: number;
  ordersByStatus: Record<string, number>;
  orderGrowth: { period: string; count: number }[];
  conversionMetrics: { totalUsers: number; buyingUsers: number; conversionRate: string };
}

export interface Notification {
  id: string;
  user_id: string;
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  type: 'info' | 'order' | 'promotion' | 'system';
  is_read: boolean;
  link: string;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export type CartItem = {
  product: Product;
  quantity: number;
};

export const ORDER_STATUS_LABELS: Record<Order['status'], { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  processing: { ar: 'قيد المعالجة', en: 'Processing' },
  shipped: { ar: 'تم الشحن', en: 'Shipped' },
  delivered: { ar: 'تم التوصيل', en: 'Delivered' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};
