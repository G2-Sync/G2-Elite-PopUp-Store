// =============================================================================
// Supabase type definitions — multi-tenant schema
// =============================================================================

// ---------------------------------------------------------------------------
// Shared value types
// ---------------------------------------------------------------------------

export type PaymentProvider = 'stripe' | 'paypal' | 'square';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded';

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

// ---------------------------------------------------------------------------
// Row types (match DB columns 1-to-1)
// ---------------------------------------------------------------------------

export type Organization = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string;
  accent_color: string;
  font_family: string;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'admin';
  created_at: string;
};

export type SuperAdmin = {
  user_id: string;
  granted_at: string;
};

export type PaymentAccount = {
  id: string;
  organization_id: string;
  provider: PaymentProvider;
  account_id: string;
  access_token: string | null;
  refresh_token: string | null;
  scope: string | null;
  expires_at: string | null;
  is_active: boolean;
  connected_at: string;
};

export type Category = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  category_id: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined relations (optional — only present when selected)
  categories?: Category | null;
  product_images?: ProductImage[];
};

export type ProductImage = {
  id: string;
  product_id: string;
  organization_id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
};

export type Order = {
  id: string;
  organization_id: string;
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

// ---------------------------------------------------------------------------
// Database interface for @supabase/supabase-js generic typing
// ---------------------------------------------------------------------------

type OmitGenerated<T> = Omit<T, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

type OmitTimestamps<T> = Omit<T, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: OmitTimestamps<Organization>;
        Update: Partial<Omit<Organization, 'id'>>;
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: OmitGenerated<OrganizationMember>;
        Update: Partial<Omit<OrganizationMember, 'id'>>;
      };
      super_admins: {
        Row: SuperAdmin;
        Insert: Omit<SuperAdmin, 'granted_at'> & { granted_at?: string };
        Update: Partial<SuperAdmin>;
      };
      payment_accounts: {
        Row: PaymentAccount;
        Insert: OmitGenerated<PaymentAccount>;
        Update: Partial<Omit<PaymentAccount, 'id'>>;
      };
      categories: {
        Row: Category;
        Insert: OmitGenerated<Category>;
        Update: Partial<Omit<Category, 'id'>>;
      };
      products: {
        Row: Product;
        Insert: OmitTimestamps<Omit<Product, 'categories' | 'product_images'>>;
        Update: Partial<Omit<Product, 'id' | 'categories' | 'product_images'>>;
      };
      product_images: {
        Row: ProductImage;
        Insert: OmitGenerated<ProductImage>;
        Update: Partial<Omit<ProductImage, 'id'>>;
      };
      orders: {
        Row: Order;
        Insert: OmitTimestamps<Omit<Order, 'order_items'>>;
        Update: Partial<Omit<Order, 'id' | 'order_items'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: OmitGenerated<OrderItem>;
        Update: Partial<Omit<OrderItem, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      auth_user_org_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
};
