export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  category_id: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  categories?: Category | null;
  product_images?: ProductImage[];
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
};

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded';

export type PaymentProvider = 'stripe' | 'paypal' | 'square';

export type Order = {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string | null;
  shipping_address: ShippingAddress | null;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  status: OrderStatus;
  payment_provider: PaymentProvider | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
};

// Supabase database schema type map
export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Category, 'id'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'categories' | 'product_images'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Product, 'id' | 'categories' | 'product_images'>>;
      };
      product_images: {
        Row: ProductImage;
        Insert: Omit<ProductImage, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<ProductImage, 'id'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_items'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Order, 'id' | 'order_items'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<OrderItem, 'id'>>;
      };
    };
  };
};
