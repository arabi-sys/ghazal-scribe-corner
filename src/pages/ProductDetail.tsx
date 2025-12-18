import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductVariant } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProductReviews } from '@/components/products/ProductReviews';
import { ShoppingCart, Minus, Plus, Package, ArrowLeft, Loader2, Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;

      const { data } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        setProduct(data as Product);
        
        // Fetch variants
        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', data.id);
        
        if (variantsData && variantsData.length > 0) {
          setVariants(variantsData as ProductVariant[]);
        }

        // Check wishlist status
        if (user) {
          const { data: wishlistData } = await supabase
            .from('wishlist')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', data.id)
            .maybeSingle();
          setIsInWishlist(!!wishlistData);
        }
      }
      setLoading(false);
    }

    fetchProduct();
  }, [slug, user]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id, quantity);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error('Please sign in to add to wishlist');
      return;
    }
    if (!product) return;

    if (isInWishlist) {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product.id);
      
      if (!error) {
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      }
    } else {
      const { error } = await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: product.id });
      
      if (!error) {
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    }
  };

  // Get unique sizes and colors from variants
  const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size))];
  const colors = [...new Set(variants.filter(v => v.color).map(v => v.color))];

  const currentPrice = product ? product.price + (selectedVariant?.price_adjustment || 0) : 0;
  const currentStock = selectedVariant ? selectedVariant.stock : product?.stock || 0;

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

  const isOutOfStock = currentStock <= 0;

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

            <div className="flex items-start justify-between gap-4">
              <h1 className="font-serif text-4xl font-bold text-foreground">{product.name}</h1>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleToggleWishlist}
                className={isInWishlist ? 'text-red-500' : ''}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <span className="text-3xl font-bold text-foreground">
                ${currentPrice.toFixed(2)}
              </span>
              {isOutOfStock ? (
                <Badge variant="destructive">Out of Stock</Badge>
              ) : (
                <Badge variant="outline">{currentStock} in stock</Badge>
              )}
            </div>

            <p className="mt-6 text-muted-foreground leading-relaxed">
              {product.description || 'No description available for this product.'}
            </p>

            {/* Variants Selection */}
            {variants.length > 0 && (
              <div className="mt-6 space-y-4">
                {sizes.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Size</label>
                    <Select onValueChange={(size) => {
                      const variant = variants.find(v => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color));
                      setSelectedVariant(variant || null);
                    }}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizes.map((size) => (
                          <SelectItem key={size} value={size!}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {colors.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color</label>
                    <Select onValueChange={(color) => {
                      const variant = variants.find(v => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size));
                      setSelectedVariant(variant || null);
                    }}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color} value={color!}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color! }} />
                              {color}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

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
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      disabled={quantity >= currentStock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button size="lg" className="w-full md:w-auto" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart - ${(currentPrice * quantity).toFixed(2)}
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

        {/* Reviews Section */}
        <div className="mt-16">
          <ProductReviews productId={product.id} />
        </div>
      </div>
    </Layout>
  );
}
