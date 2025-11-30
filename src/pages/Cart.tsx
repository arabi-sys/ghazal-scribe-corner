import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Minus, Plus, Trash2, ShoppingBag, Package } from 'lucide-react';

export default function Cart() {
  const { items, loading, updateQuantity, removeFromCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-serif text-2xl font-bold">Please sign in</h1>
          <p className="text-muted-foreground mt-2">You need to sign in to view your cart</p>
          <Link to="/auth">
            <Button className="mt-6">Sign In</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-serif text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground mt-2">Start shopping to add items to your cart</p>
          <Link to="/products">
            <Button className="mt-6">Browse Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden shrink-0">
                      {item.products?.image_url ? (
                        <img 
                          src={item.products.image_url} 
                          alt={item.products.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.products?.slug}`}>
                        <h3 className="font-semibold hover:text-primary transition-colors">
                          {item.products?.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${item.products?.price.toFixed(2)} each
                      </p>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center border border-border rounded">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (item.products?.stock || 0)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold">
                        ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
                
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
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>

                <Link to="/products">
                  <Button variant="ghost" className="w-full mt-2">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
