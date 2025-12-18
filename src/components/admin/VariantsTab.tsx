import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Product, ProductVariant } from '@/lib/types';
import { toast } from 'sonner';
import { Edit, Trash2, Plus } from 'lucide-react';

interface VariantsTabProps {
  products: Product[];
  onRefresh: () => void;
}

export function VariantsTab({ products, onRefresh }: VariantsTabProps) {
  const [variants, setVariants] = useState<(ProductVariant & { products?: Product })[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [form, setForm] = useState({
    product_id: '',
    size: '',
    color: '',
    stock: 0,
    price_adjustment: 0
  });

  useEffect(() => {
    fetchVariants();
  }, []);

  const fetchVariants = async () => {
    const { data } = await supabase
      .from('product_variants')
      .select('*, products(*)')
      .order('created_at', { ascending: false });
    if (data) setVariants(data as any);
  };

  const resetForm = () => {
    setForm({ product_id: '', size: '', color: '', stock: 0, price_adjustment: 0 });
    setEditingVariant(null);
  };

  const openEditDialog = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setForm({
      product_id: variant.product_id,
      size: variant.size || '',
      color: variant.color || '',
      stock: variant.stock,
      price_adjustment: variant.price_adjustment
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        product_id: form.product_id,
        size: form.size || null,
        color: form.color || null,
        stock: form.stock,
        price_adjustment: form.price_adjustment
      };

      if (editingVariant) {
        const { error } = await supabase
          .from('product_variants')
          .update(data)
          .eq('id', editingVariant.id);
        if (error) throw error;
        toast.success('Variant updated');
      } else {
        const { error } = await supabase.from('product_variants').insert(data);
        if (error) throw error;
        toast.success('Variant created');
      }

      setDialogOpen(false);
      resetForm();
      fetchVariants();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Error saving variant');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variant?')) return;
    const { error } = await supabase.from('product_variants').delete().eq('id', id);
    if (error) {
      toast.error('Error deleting variant');
    } else {
      toast.success('Variant deleted');
      fetchVariants();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Product Variants ({variants.length})</CardTitle>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price Adj.</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell>{(variant as any).products?.name || 'Unknown'}</TableCell>
                <TableCell>{variant.size || '-'}</TableCell>
                <TableCell>
                  {variant.color ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border" 
                        style={{ backgroundColor: variant.color }}
                      />
                      {variant.color}
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>{variant.stock}</TableCell>
                <TableCell>
                  {variant.price_adjustment > 0 ? '+' : ''}${variant.price_adjustment.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(variant)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(variant.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Size</Label>
                <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="e.g., S, M, L, XL" />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="e.g., Red, Blue" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label>Price Adjustment ($)</Label>
                <Input type="number" step="0.01" value={form.price_adjustment} onChange={(e) => setForm({ ...form, price_adjustment: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.product_id}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
