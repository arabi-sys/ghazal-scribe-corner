import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Discount } from '@/lib/types';
import { toast } from 'sonner';
import { Edit, Trash2, Plus } from 'lucide-react';

interface DiscountsTabProps {
  discounts: Discount[];
  onRefresh: () => void;
}

export function DiscountsTab({ discounts, onRefresh }: DiscountsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_amount: 0,
    max_uses: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  const resetForm = () => {
    setForm({
      name: '',
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_amount: 0,
      max_uses: '',
      start_date: '',
      end_date: '',
      is_active: true
    });
    setEditingDiscount(null);
  };

  const openEditDialog = (discount: Discount) => {
    setEditingDiscount(discount);
    setForm({
      name: discount.name,
      code: discount.code,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      min_order_amount: discount.min_order_amount,
      max_uses: discount.max_uses?.toString() || '',
      start_date: discount.start_date?.split('T')[0] || '',
      end_date: discount.end_date?.split('T')[0] || '',
      is_active: discount.is_active
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        name: form.name,
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_order_amount: form.min_order_amount,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active
      };

      if (editingDiscount) {
        const { error } = await supabase
          .from('discounts')
          .update(data)
          .eq('id', editingDiscount.id);
        if (error) throw error;
        toast.success('Discount updated');
      } else {
        const { error } = await supabase.from('discounts').insert(data);
        if (error) throw error;
        toast.success('Discount created');
      }

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Error saving discount');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this discount?')) return;
    const { error } = await supabase.from('discounts').delete().eq('id', id);
    if (error) {
      toast.error('Error deleting discount');
    } else {
      toast.success('Discount deleted');
      onRefresh();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Discount Codes ({discounts.length})</CardTitle>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Discount
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((discount) => (
              <TableRow key={discount.id}>
                <TableCell className="font-mono font-bold">{discount.code}</TableCell>
                <TableCell>{discount.name}</TableCell>
                <TableCell>{discount.discount_type}</TableCell>
                <TableCell>
                  {discount.discount_type === 'percentage' 
                    ? `${discount.discount_value}%` 
                    : `$${discount.discount_value}`}
                </TableCell>
                <TableCell>${discount.min_order_amount}</TableCell>
                <TableCell>
                  {discount.used_count}/{discount.max_uses || '∞'}
                </TableCell>
                <TableCell>
                  <Badge variant={discount.is_active ? 'default' : 'secondary'}>
                    {discount.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(discount)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(discount.id)}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDiscount ? 'Edit Discount' : 'Add Discount'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Code</Label>
              <Input 
                value={form.code} 
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                placeholder="e.g., SAVE20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Value</Label>
                <Input 
                  type="number" 
                  value={form.discount_value} 
                  onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Min Order Amount</Label>
                <Input 
                  type="number" 
                  value={form.min_order_amount} 
                  onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })} 
                />
              </div>
              <div className="grid gap-2">
                <Label>Max Uses (blank = unlimited)</Label>
                <Input 
                  type="number" 
                  value={form.max_uses} 
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.code}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
