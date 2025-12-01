export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category_id: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  shipping_address: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
}

export interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  content_url: string | null;
  price: number;
  is_free: boolean;
  genre: string | null;
  pages: number | null;
  isbn: string | null;
  created_at: string;
}

export interface UserEbook {
  id: string;
  user_id: string;
  ebook_id: string;
  purchased_at: string;
  ebooks?: Ebook;
}

export interface MoneyTransfer {
  id: string;
  user_id: string;
  sender_full_name: string;
  sender_id_number: string;
  sender_id_picture_url: string | null;
  sender_phone: string;
  amount: number;
  receiver_full_name: string;
  transfer_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  status: string;
  stripe_payment_id: string | null;
  created_at: string;
}
