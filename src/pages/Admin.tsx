import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category, Order, Profile, Transaction, MoneyTransfer } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Package, Users, ShoppingCart, DollarSign, Send, Check, X } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<MoneyTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', slug: '', description: '', price: '', stock: '', category_id: '', is_featured: false, image_url: '' });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
      return;
    }
    if (isAdmin) fetchData();
  }, [user, isAdmin, authLoading, navigate]);

  const fetchData = async () => {
    const [productsRes, categoriesRes, ordersRes, usersRes, transactionsRes, transfersRes] = await Promise.all([
      supabase.from('products').select('*, categories(*)').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('money_transfers').select('*').order('created_at', { ascending: false })
    ]);
    if (productsRes.data) setProducts(productsRes.data as Product[]);
    if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (usersRes.data) setUsers(usersRes.data as Profile[]);
    if (transactionsRes.data) setTransactions(transactionsRes.data as Transaction[]);
    if (transfersRes.data) setTransfers(transfersRes.data as MoneyTransfer[]);
    setLoading(false);
  };

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
    setEditingProduct(null);
    setProductForm({ name: '', slug: '', description: '', price: '', stock: '', category_id: '', is_featured: false, image_url: '' });
    fetchData();
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

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) toast.error('Failed to update order');
    else {
      toast.success('Order status updated');
      fetchData();
    }
  };

  const handleUpdateTransferStatus = async (transferId: string, status: string) => {
    const { error } = await supabase.from('money_transfers').update({ status }).eq('id', transferId);
    if (error) toast.error('Failed to update transfer');
    else {
      toast.success('Transfer status updated');
      fetchData();
    }
  };

  if (authLoading || loading) {
    return <Layout><div className="container flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>;
  }

  const totalRevenue = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const pendingTransfers = transfers.filter(t => t.status === 'pending').length;

  return (
    <Layout>
      <div className="container py-12">
        <h1 className="font-serif text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card><CardContent className="p-6 flex items-center gap-4"><Package className="h-10 w-10 text-primary" /><div><p className="text-sm text-muted-foreground">Products</p><p className="text-2xl font-bold">{products.length}</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center gap-4"><Users className="h-10 w-10 text-primary" /><div><p className="text-sm text-muted-foreground">Users</p><p className="text-2xl font-bold">{users.length}</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center gap-4"><ShoppingCart className="h-10 w-10 text-primary" /><div><p className="text-sm text-muted-foreground">Orders</p><p className="text-2xl font-bold">{orders.length}</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center gap-4"><DollarSign className="h-10 w-10 text-primary" /><div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center gap-4"><Send className="h-10 w-10 text-primary" /><div><p className="text-sm text-muted-foreground">Pending Transfers</p><p className="text-2xl font-bold">{pendingTransfers}</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="mb-6 flex-wrap h-auto gap-2">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Products ({products.length})</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild><Button onClick={() => { setEditingProduct(null); setProductForm({ name: '', slug: '', description: '', price: '', stock: '', category_id: '', is_featured: false, image_url: '' }); }}><Plus className="h-4 w-4 mr-2" />Add Product</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Name</Label><Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
                    <div><Label>Price</Label><Input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} /></div>
                    <div><Label>Stock</Label><Input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} /></div>
                    <ImageUpload value={productForm.image_url} onChange={(url) => setProductForm({...productForm, image_url: url})} />
                    <div><Label>Category</Label><Select value={productForm.category_id} onValueChange={v => setProductForm({...productForm, category_id: v})}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Description</Label><Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
                    <Button onClick={handleSaveProduct} className="w-full">{editingProduct ? 'Update' : 'Create'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
              {products.map(p => (<TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.categories?.name || '-'}</TableCell><TableCell>${p.price.toFixed(2)}</TableCell><TableCell><Badge variant={p.stock > 10 ? 'secondary' : p.stock > 0 ? 'outline' : 'destructive'}>{p.stock}</Badge></TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => openEditDialog(p)}><Edit className="h-4 w-4" /></Button></TableCell></TableRow>))}
            </TableBody></Table></Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card><Table><TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
              {orders.map(o => (<TableRow key={o.id}>
                <TableCell className="font-mono text-sm">{o.id.slice(0, 8)}</TableCell>
                <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                <TableCell><Badge>{o.status}</Badge></TableCell>
                <TableCell>${o.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={(v) => handleUpdateOrderStatus(o.id, v)}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>))}
            </TableBody></Table></Card>
          </TabsContent>

          <TabsContent value="users">
            <Card><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader><TableBody>
              {users.map(u => (<TableRow key={u.id}><TableCell>{u.full_name || '-'}</TableCell><TableCell>{u.email}</TableCell><TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell></TableRow>))}
            </TableBody></Table></Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
              {transactions.map(t => (<TableRow key={t.id}><TableCell className="font-mono text-sm">{t.id.slice(0, 8)}</TableCell><TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell><TableCell>${t.amount.toFixed(2)}</TableCell><TableCell><Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>{t.status}</Badge></TableCell></TableRow>))}
            </TableBody></Table></Card>
          </TabsContent>

          <TabsContent value="transfers">
            <Card><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Sender</TableHead><TableHead>Receiver</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
              {transfers.map(t => (<TableRow key={t.id}>
                <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{t.sender_full_name}</TableCell>
                <TableCell>{t.receiver_full_name}</TableCell>
                <TableCell>${t.amount.toFixed(2)}</TableCell>
                <TableCell><Badge variant={t.status === 'completed' ? 'default' : t.status === 'declined' ? 'destructive' : 'secondary'}>{t.status}</Badge></TableCell>
                <TableCell className="flex gap-2">
                  {t.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateTransferStatus(t.id, 'completed')}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleUpdateTransferStatus(t.id, 'declined')}><X className="h-4 w-4" /></Button>
                    </>
                  )}
                </TableCell>
              </TableRow>))}
            </TableBody></Table></Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
