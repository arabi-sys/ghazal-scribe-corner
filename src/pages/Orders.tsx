import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/lib/types';
import { Loader2, Package, ShoppingBag } from 'lucide-react';

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data as OrderWithItems[]);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (orders.length === 0) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-serif text-2xl font-bold">No orders yet</h1>
          <p className="text-muted-foreground mt-2">Start shopping to see your orders here</p>
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
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Order History</h1>

        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.product_price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-medium">
                        ${(item.product_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <hr className="my-4" />

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {order.shipping_address && (
                      <p>Ship to: {order.shipping_address.slice(0, 50)}...</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
