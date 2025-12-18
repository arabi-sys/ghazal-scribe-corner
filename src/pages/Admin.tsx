import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category, Order, Profile, Transaction, MoneyTransfer, Ebook, Discount } from '@/lib/types';
import { Loader2, Package, Users, ShoppingCart, DollarSign, Send, LogOut, FolderOpen, BookOpen, BookCopy, Percent, BarChart } from 'lucide-react';
import { ProductsTab } from '@/components/admin/ProductsTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { OrdersTab } from '@/components/admin/OrdersTab';
import { TransactionsTab } from '@/components/admin/TransactionsTab';
import { TransfersTab } from '@/components/admin/TransfersTab';
import { CategoriesTab } from '@/components/admin/CategoriesTab';
import { EbooksTab } from '@/components/admin/EbooksTab';
import { ExchangeBooksTab } from '@/components/admin/ExchangeBooksTab';
import { DiscountsTab } from '@/components/admin/DiscountsTab';
import { VariantsTab } from '@/components/admin/VariantsTab';
import { ReportsTab } from '@/components/admin/ReportsTab';
import { toast } from 'sonner';

export default function Admin() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<MoneyTransfer[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [exchangeBooks, setExchangeBooks] = useState<any[]>([]);
  const [exchangeTransactions, setExchangeTransactions] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
      return;
    }
    if (isAdmin) fetchData();
  }, [user, isAdmin, authLoading, navigate]);

  const fetchData = async () => {
    const [productsRes, categoriesRes, ordersRes, usersRes, transactionsRes, transfersRes, ebooksRes, exchangeBooksRes, exchangeTransactionsRes, discountsRes] = await Promise.all([
      supabase.from('products').select('*, categories(*)').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('money_transfers').select('*').order('created_at', { ascending: false }),
      supabase.from('ebooks').select('*').order('title'),
      supabase.from('exchange_books').select('*').order('created_at', { ascending: false }),
      supabase.from('exchange_transactions').select('*, exchange_books(*)').order('created_at', { ascending: false }),
      supabase.from('discounts').select('*').order('created_at', { ascending: false })
    ]);
    if (productsRes.data) setProducts(productsRes.data as Product[]);
    if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (usersRes.data) setUsers(usersRes.data as Profile[]);
    if (transactionsRes.data) setTransactions(transactionsRes.data as Transaction[]);
    if (transfersRes.data) setTransfers(transfersRes.data as MoneyTransfer[]);
    if (ebooksRes.data) setEbooks(ebooksRes.data as Ebook[]);
    if (exchangeBooksRes.data) setExchangeBooks(exchangeBooksRes.data);
    if (exchangeTransactionsRes.data) setExchangeTransactions(exchangeTransactionsRes.data);
    if (discountsRes.data) setDiscounts(discountsRes.data as Discount[]);
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  const totalRevenue = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const pendingTransfers = transfers.filter(t => t.status === 'pending').length;

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-serif text-4xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Products</p>
                <p className="text-xl font-bold">{products.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Users</p>
                <p className="text-xl font-bold">{users.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-xl font-bold">{orders.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">${totalRevenue.toFixed(0)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Send className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{pendingTransfers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Percent className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Discounts</p>
                <p className="text-xl font-bold">{discounts.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="mb-6 flex-wrap h-auto gap-2">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="discounts">Discounts</TabsTrigger>
            <TabsTrigger value="ebooks">Ebooks</TabsTrigger>
            <TabsTrigger value="exchange">Book Exchange</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsTab products={products} categories={categories} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="variants">
            <VariantsTab products={products} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab categories={categories} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="discounts">
            <DiscountsTab discounts={discounts} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="ebooks">
            <EbooksTab ebooks={ebooks} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab orders={orders} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab users={users} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTab transactions={transactions} />
          </TabsContent>

          <TabsContent value="transfers">
            <TransfersTab transfers={transfers} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="exchange">
            <ExchangeBooksTab books={exchangeBooks} transactions={exchangeTransactions} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab 
              products={products} 
              orders={orders} 
              users={users} 
              transactions={transactions} 
              transfers={transfers} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
