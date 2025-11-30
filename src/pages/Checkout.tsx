import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Package } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      toast.error('Please enter a shipping address');
      return;
    }

    setLoading(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: totalPrice,
          shipping_address: shippingAddress,
          status: 'confirmed'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products?.name || 'Unknown Product',
        product_price: item.products?.price || 0,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of items) {
        const newStock = (item.products?.stock || 0) - item.quantity;
        await supabase
          .from('products')
          .update({ stock: Math.max(0, newStock) })
          .eq('id', item.product_id);
      }

      // Create transaction
      await supabase
        .from('transactions')
        .insert({
          order_id: order.id,
          user_id: user.id,
          amount: totalPrice,
          status: 'completed'
        });

      // Clear cart
      await clearCart();

      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-12 max-w-4xl">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Form */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Shipping Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full shipping address..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden shrink-0">
                      {item.products?.image_url ? (
                        <img 
                          src={item.products.image_url} 
                          alt={item.products.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.products?.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">
                      ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
              </div>

              <hr className="my-4" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>

              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Place Order
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                By placing your order, you agree to our terms and conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
