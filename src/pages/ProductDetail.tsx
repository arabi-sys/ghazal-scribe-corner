import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Minus, Plus, Package, ArrowLeft, Loader2 } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;

      const { data } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('slug', slug)
        .maybeSingle();

      if (data) setProduct(data as Product);
      setLoading(false);
    }

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id, quantity);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link to="/products">
            <Button className="mt-4">Back to Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <Layout>
      <div className="container py-12">
        <Link to="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.categories && (
              <Link to={`/products?category=${product.categories.slug}`}>
                <Badge variant="secondary" className="mb-4">
                  {product.categories.name}
                </Badge>
              </Link>
            )}

            <h1 className="font-serif text-4xl font-bold text-foreground">{product.name}</h1>

            <div className="mt-4 flex items-center gap-4">
              <span className="text-3xl font-bold text-foreground">
                ${product.price.toFixed(2)}
              </span>
              {isOutOfStock ? (
                <Badge variant="destructive">Out of Stock</Badge>
              ) : (
                <Badge variant="outline">{product.stock} in stock</Badge>
              )}
            </div>

            <p className="mt-6 text-muted-foreground leading-relaxed">
              {product.description || 'No description available for this product.'}
            </p>

            {/* Quantity & Add to Cart */}
            {!isOutOfStock && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border border-border rounded-lg">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center">{quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button size="lg" className="w-full md:w-auto" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart - ${(product.price * quantity).toFixed(2)}
                </Button>
              </div>
            )}

            {isOutOfStock && (
              <div className="mt-8">
                <Button size="lg" disabled className="w-full md:w-auto">
                  Out of Stock
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
