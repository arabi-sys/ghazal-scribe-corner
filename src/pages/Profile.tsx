import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, User, Package, Settings, BookOpen, CreditCard, Edit2, Save, X } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  order_items: {
    product_name: string;
    quantity: number;
    product_price: number;
  }[];
}

interface UserEbook {
  id: string;
  purchased_at: string;
  ebooks: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ebooks, setEbooks] = useState<UserEbook[]>([]);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [profileRes, ordersRes, ebooksRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('orders')
          .select('*, order_items(product_name, quantity, product_price)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_ebooks')
          .select('*, ebooks(id, title, author, cover_url)')
          .eq('user_id', user.id)
          .order('purchased_at', { ascending: false })
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setFormData({
          full_name: profileRes.data.full_name || '',
          phone: profileRes.data.phone || '',
          address: profileRes.data.address || '',
          date_of_birth: profileRes.data.date_of_birth || '',
          avatar_url: profileRes.data.avatar_url || ''
        });
      }
      
      if (ordersRes.data) setOrders(ordersRes.data);
      if (ebooksRes.data) setEbooks(ebooksRes.data as UserEbook[]);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          date_of_birth: formData.date_of_birth || null,
          avatar_url: formData.avatar_url
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        date_of_birth: profile.date_of_birth || '',
        avatar_url: profile.avatar_url || ''
      });
    }
    setEditing(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'default';
      case 'processing':
      case 'shipped':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

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
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-serif">My Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account and view your history</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="ebooks" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Ebooks</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </div>
                  {!editing ? (
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleCancel} disabled={saving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={formData.avatar_url} />
                    <AvatarFallback className="text-2xl">
                      {formData.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {editing && (
                    <div className="flex-1 max-w-xs">
                      <Label>Profile Picture</Label>
                      <ImageUpload
                        value={formData.avatar_url}
                        onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                        bucket="product-images"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={!editing}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editing}
                      placeholder="+961 XX XXX XXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      disabled={!editing}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!editing}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>View all your past orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={getStatusBadgeVariant(order.status)}>
                                {order.status}
                              </Badge>
                              <p className="font-semibold mt-1">${order.total.toFixed(2)}</p>
                            </div>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.order_items.map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{item.product_name}</TableCell>
                                  <TableCell className="text-center">{item.quantity}</TableCell>
                                  <TableCell className="text-right">${item.product_price.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ebooks Tab */}
          <TabsContent value="ebooks">
            <Card>
              <CardHeader>
                <CardTitle>My Ebooks</CardTitle>
                <CardDescription>Ebooks you've purchased</CardDescription>
              </CardHeader>
              <CardContent>
                {ebooks.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No ebooks yet</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/ebooks')}>
                      Browse Ebooks
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {ebooks.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="aspect-[3/4] relative">
                          {item.ebooks.cover_url ? (
                            <img
                              src={item.ebooks.cover_url}
                              alt={item.ebooks.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-1">{item.ebooks.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.ebooks.author}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Purchased {new Date(item.purchased_at).toLocaleDateString()}
                          </p>
                          <Button 
                            className="w-full mt-3" 
                            size="sm"
                            onClick={() => navigate(`/read/${item.ebooks.id}`)}
                          >
                            Read Now
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">Update your password</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/reset-password')}>
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">My Wishlist</p>
                      <p className="text-sm text-muted-foreground">View saved items</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/wishlist')}>
                      View
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Money Transfers</p>
                      <p className="text-sm text-muted-foreground">View your transfer history</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/transfers')}>
                      View
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                    <div>
                      <p className="font-medium text-destructive">Sign Out</p>
                      <p className="text-sm text-muted-foreground">Sign out of your account</p>
                    </div>
                    <Button variant="destructive" onClick={signOut}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
