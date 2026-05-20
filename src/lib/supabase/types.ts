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
  sort_order: number;
  has_sizes: boolean;
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
  size: string | null;
  created_at: string;
};

// Allowed product sizes. Defined as a const so the storefront, admin form,
// and validation all share the same list.
export const PRODUCT_SIZES = ['X-Small', 'Small', 'Medium', 'Large', 'X-Large'] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

// ---------------------------------------------------------------------------
// Database interface for @supabase/supabase-js generic typing
// ---------------------------------------------------------------------------

// Make nullable fields optional in Insert types (so callers can omit them)
type NullableKeys<T> = { [K in keyof T]: null extends T[K] ? K : never }[keyof T];
type NonNullableKeys<T> = { [K in keyof T]: null extends T[K] ? never : K }[keyof T];
type MakeNullableOptional<T> = Partial<Pick<T, NullableKeys<T>>> & Pick<T, NonNullableKeys<T>>;

type OmitGenerated<T> = MakeNullableOptional<Omit<T, 'id' | 'created_at'>> & {
  id?: string;
  created_at?: string;
};

type OmitTimestamps<T> = MakeNullableOptional<Omit<T, 'id' | 'created_at' | 'updated_at'>> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: OmitTimestamps<Organization>;
        Update: Partial<Omit<Organization, 'id'>>;
        Relationships: [];
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: OmitGenerated<OrganizationMember>;
        Update: Partial<Omit<OrganizationMember, 'id'>>;
        Relationships: [];
      };
      super_admins: {
        Row: SuperAdmin;
        Insert: Omit<SuperAdmin, 'granted_at'> & { granted_at?: string };
        Update: Partial<SuperAdmin>;
        Relationships: [];
      };
      payment_accounts: {
        Row: PaymentAccount;
        Insert: OmitGenerated<PaymentAccount>;
        Update: Partial<Omit<PaymentAccount, 'id'>>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: OmitGenerated<Category>;
        Update: Partial<Omit<Category, 'id'>>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: OmitTimestamps<Omit<Product, 'categories' | 'product_images'>>;
        Update: Partial<Omit<Product, 'id' | 'categories' | 'product_images'>>;
        Relationships: [];
      };
      product_images: {
        Row: ProductImage;
        Insert: OmitGenerated<ProductImage>;
        Update: Partial<Omit<ProductImage, 'id'>>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: OmitTimestamps<Omit<Order, 'order_items'>>;
        Update: Partial<Omit<Order, 'id' | 'order_items'>>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItem;
        Insert: OmitGenerated<OrderItem>;
        Update: Partial<Omit<OrderItem, 'id'>>;
        Relationships: [];
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
    CompositeTypes: Record<string, never>;
  };
};
