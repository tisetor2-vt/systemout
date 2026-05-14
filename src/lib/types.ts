export type UserRole = "admin" | "operator";

export type Category = {
  id: string;
  name: string;
  image_url?: string | null;
  created_at?: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  category_id?: string | null;
  image_urls: string[];
  material?: string | null;
  sizes?: string[];
  colors?: string[];
  featured: boolean;
  active: boolean;
  visible_in_catalog: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Sale = {
  id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  status: string;
  created_by?: string | null;
  created_at?: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id?: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type FinanceEntry = {
  id: string;
  type: "entrada" | "saida";
  category: string;
  description?: string | null;
  amount: number;
  reference_type?: string | null;
  reference_id?: string | null;
  occurred_on: string;
  created_at?: string;
};

export type CashSession = {
  id: string;
  opened_by: string;
  opening_amount: number;
  closing_amount?: number | null;
  notes?: string | null;
  opened_at: string;
  closed_at?: string | null;
};

export type StoreBanner = {
  id: string;
  title?: string | null;
  image_url: string;
  link_url?: string | null;
  sort_order: number;
  active: boolean;
};

export type StoreSettings = {
  id: string;
  store_name: string;
  logo_url?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  custom_domain?: string | null;
  theme?: string | null;
  header_top_text?: string | null;
  header_bottom_text?: string | null;
  footer_text?: string | null;
  delivery_deadline?: string | null;
  exchange_policy?: string | null;
  contact_text?: string | null;
  about_text?: string | null;
  links_json?: Record<string, string | number | boolean> | null;
};
