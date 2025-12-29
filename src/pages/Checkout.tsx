import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Package, Truck, Wallet } from 'lucide-react';
import { notifyAdmins } from '@/hooks/useNotifications';
import { triggerConfetti } from '@/components/ui/confetti';

type PaymentMethod = 'cash_on_delivery' | 'wishmoney';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');

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
      // Create order with payment method
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: totalPrice,
          shipping_address: shippingAddress,
          status: paymentMethod === 'cash_on_delivery' ? 'confirmed' : 'pending_payment'
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

      // Update product stock using the security definer function
      for (const item of items) {
        await supabase.rpc('decrement_product_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        });
      }

      // Create transaction with payment method
      await supabase
        .from('transactions')
        .insert({
          order_id: order.id,
          user_id: user.id,
          amount: totalPrice,
          status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'completed'
        });

      // Clear cart
      await clearCart();

      // Notify admins about new order
      const paymentLabel = paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'WishMoney';
      await notifyAdmins(
        'new_order',
        'New Order Placed',
        `Order #${order.id.slice(0, 8)} - $${totalPrice.toFixed(2)} (${paymentLabel})`,
        order.id
      );

      // Send order confirmation email
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', user.id)
          .maybeSingle();

        const recipientEmail = profile?.email || user.email;

        if (recipientEmail) {
          const { error: emailInvokeError } = await supabase.functions.invoke(
            'send-order-confirmation',
            {
              body: {
                email: recipientEmail,
                fullName: profile?.full_name || 'Customer',
                orderId: order.id,
                items: items.map((item) => ({
                  name: item.products?.name || 'Unknown Product',
                  quantity: item.quantity,
                  price: item.products?.price || 0,
                })),
                total: totalPrice,
                shippingAddress,
                paymentMethod: paymentLabel,
              },
            }
          );

          if (emailInvokeError) {
            throw emailInvokeError;
          }
        }
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        toast.warning('Order placed, but confirmation email was not sent.');
      }

      triggerConfetti();
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
          {/* Shipping & Payment */}
          <div className="space-y-6">
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

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose how you'd like to pay</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                  className="space-y-3"
                >
                  <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cash_on_delivery' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                    <Label htmlFor="cash_on_delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="p-2 rounded-full bg-muted">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                      </div>
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'wishmoney' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="wishmoney" id="wishmoney" />
                    <Label htmlFor="wishmoney" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="p-2 rounded-full bg-muted">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">WishMoney</p>
                        <p className="text-sm text-muted-foreground">Pay instantly with WishMoney</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <Card className="h-fit">
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span>{paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'WishMoney'}</span>
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
                {paymentMethod === 'cash_on_delivery' ? 'Place Order' : 'Pay with WishMoney'}
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
