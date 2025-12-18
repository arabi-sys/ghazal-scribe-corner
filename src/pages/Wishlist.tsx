import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { WishlistItem } from '@/lib/types';
import { toast } from 'sonner';
import { Heart, ShoppingCart, Trash2, Loader2, Package } from 'lucide-react';

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    const { data } = await supabase
      .from('wishlist')
      .select('*, products(*)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (data) setWishlist(data as WishlistItem[]);
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from('wishlist').delete().eq('id', id);
    if (error) {
      toast.error('Failed to remove item');
    } else {
      toast.success('Removed from wishlist');
      fetchWishlist();
    }
  };

  const handleAddToCart = (productId: string) => {
    addToCart(productId, 1);
    toast.success('Added to cart');
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view your wishlist</h1>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-4xl font-bold">My Wishlist</h1>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-4">Save items you love to your wishlist</p>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square bg-muted">
                  {item.products?.image_url ? (
                    <img
                      src={item.products.image_url}
                      alt={item.products.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">
                    <Link to={`/products/${item.products?.slug}`} className="hover:text-primary">
                      {item.products?.name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${item.products?.price.toFixed(2)}</p>
                  {item.products?.stock === 0 && (
                    <p className="text-sm text-destructive">Out of stock</p>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => handleAddToCart(item.product_id)}
                    disabled={item.products?.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleRemove(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
