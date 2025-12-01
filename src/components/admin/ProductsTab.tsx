import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
}

export function ProductsTab({ products, categories, onRefresh }: ProductsTabProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', slug: '', description: '', price: '', stock: '', category_id: '', is_featured: false, image_url: ''
  });

  const handleSaveProduct = async () => {
    const productData = {
      name: productForm.name,
      slug: productForm.slug || productForm.name.toLowerCase().replace(/\s+/g, '-'),
      description: productForm.description,
      price: parseFloat(productForm.price) || 0,
      stock: parseInt(productForm.stock) || 0,
      category_id: productForm.category_id || null,
      is_featured: productForm.is_featured,
      image_url: productForm.image_url || null
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
      if (error) toast.error('Failed to update product');
      else toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(productData);
      if (error) toast.error('Failed to create product');
      else toast.success('Product created');
    }
    setDialogOpen(false);
    resetForm();
    onRefresh();
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) toast.error('Failed to delete product');
    else {
      toast.success('Product deleted');
      onRefresh();
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category_id: product.category_id || '',
      is_featured: product.is_featured,
      image_url: product.image_url || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setProductForm({ name: '', slug: '', description: '', price: '', stock: '', category_id: '', is_featured: false, image_url: '' });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Products ({products.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
              <div><Label>Price</Label><Input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} /></div>
              <div><Label>Stock</Label><Input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} /></div>
              <ImageUpload value={productForm.image_url} onChange={(url) => setProductForm({...productForm, image_url: url})} />
              <div>
                <Label>Category</Label>
                <Select value={productForm.category_id} onValueChange={v => setProductForm({...productForm, category_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
              <Button onClick={handleSaveProduct} className="w-full">{editingProduct ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">No img</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.categories?.name || '-'}</TableCell>
                <TableCell>${p.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={p.stock > 10 ? 'secondary' : p.stock > 0 ? 'outline' : 'destructive'}>{p.stock}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete "{p.name}"? This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProduct(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
