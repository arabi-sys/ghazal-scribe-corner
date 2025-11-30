import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { CartItem, Product } from '@/lib/types';
import { toast } from 'sonner';

interface CartContextType {
  items: (CartItem & { products: Product })[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<(CartItem & { products: Product })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching cart:', error);
    } else {
      setItems(data as (CartItem & { products: Product })[]);
    }
    setLoading(false);
  };

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    const existingItem = items.find(item => item.product_id === productId);
    
    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({ user_id: user.id, product_id: productId, quantity });
      
      if (error) {
        toast.error('Failed to add to cart');
      } else {
        toast.success('Added to cart');
        fetchCart();
      }
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);
    
    if (error) {
      toast.error('Failed to update quantity');
    } else {
      fetchCart();
    }
  };

  const removeFromCart = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      toast.error('Failed to remove item');
    } else {
      toast.success('Removed from cart');
      fetchCart();
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);
    
    if (!error) {
      setItems([]);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      loading, 
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
