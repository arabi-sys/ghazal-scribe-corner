import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Upload, Clock, ShoppingCart, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface ExchangeBook {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  condition: string;
  description?: string;
  image_url?: string;
  status: string;
  price: number;
  depositor_id: string;
  created_at: string;
}

interface ExchangeTransaction {
  id: string;
  book_id: string;
  transaction_type: string;
  status: string;
  loan_due_date?: string;
  created_at: string;
  exchange_books: ExchangeBook;
}

export default function BookExchange() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableBooks, setAvailableBooks] = useState<ExchangeBook[]>([]);
  const [myDeposits, setMyDeposits] = useState<ExchangeBook[]>([]);
  const [myTransactions, setMyTransactions] = useState<ExchangeTransaction[]>([]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [hasOverdueBooks, setHasOverdueBooks] = useState(false);

  const [depositForm, setDepositForm] = useState({
    title: '',
    author: '',
    isbn: '',
    condition: 'good',
    description: '',
    image_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
      checkOverdueStatus();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, depositsRes, transactionsRes] = await Promise.all([
        supabase.from('exchange_books').select('*').eq('status', 'available'),
        supabase.from('exchange_books').select('*').eq('depositor_id', user?.id),
        supabase
          .from('exchange_transactions')
          .select('*, exchange_books(*)')
          .eq('user_id', user?.id)
      ]);

      if (booksRes.data) setAvailableBooks(booksRes.data);
      if (depositsRes.data) setMyDeposits(depositsRes.data);
      if (transactionsRes.data) setMyTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const checkOverdueStatus = async () => {
    const { data } = await supabase
      .from('exchange_transactions')
      .select('*')
      .eq('user_id', user?.id)
      .eq('transaction_type', 'borrow')
      .eq('status', 'active')
      .lt('loan_due_date', new Date().toISOString());

    setHasOverdueBooks((data?.length || 0) > 0);
  };

  const handleDepositBook = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('exchange_books').insert({
        ...depositForm,
        depositor_id: user.id,
        status: 'pending_approval',
        price: 5.00
      });

      if (error) throw error;

      toast({ title: 'Book submitted for approval!' });
      setShowDepositDialog(false);
      setDepositForm({
        title: '',
        author: '',
        isbn: '',
        condition: 'good',
        description: '',
        image_url: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error depositing book:', error);
      toast({ title: 'Error submitting book', variant: 'destructive' });
    }
  };

  const handleRequestBook = async (bookId: string, transactionType: 'borrow' | 'purchase') => {
    if (!user) return;

    if (hasOverdueBooks && transactionType === 'borrow') {
      toast({
        title: 'Cannot borrow books',
        description: 'You have overdue books. Please return them first.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase.from('exchange_transactions').insert({
        book_id: bookId,
        user_id: user.id,
        transaction_type: transactionType,
        status: 'pending_approval'
      });

      if (error) throw error;

      toast({ title: `${transactionType === 'borrow' ? 'Borrow' : 'Purchase'} request submitted!` });
      fetchData();
    } catch (error) {
      console.error('Error requesting book:', error);
      toast({ title: 'Error submitting request', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Book Exchange</h1>
          <p className="text-muted-foreground mt-2">
            Share your used books with others. Borrow for free or purchase for $5.
          </p>
        </div>
        <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Deposit Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Deposit a Book</DialogTitle>
              <DialogDescription>
                Submit your used book for approval. Once approved, others can borrow or purchase it.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={depositForm.title}
                  onChange={(e) => setDepositForm({ ...depositForm, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={depositForm.author}
                  onChange={(e) => setDepositForm({ ...depositForm, author: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="isbn">ISBN (Optional)</Label>
                <Input
                  id="isbn"
                  value={depositForm.isbn}
                  onChange={(e) => setDepositForm({ ...depositForm, isbn: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={depositForm.condition}
                  onValueChange={(value) => setDepositForm({ ...depositForm, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={depositForm.description}
                  onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Book Cover (Optional)</Label>
                <ImageUpload
                  value={depositForm.image_url}
                  onChange={(url) => setDepositForm({ ...depositForm, image_url: url })}
                  bucket="product-images"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDepositDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDepositBook}
                disabled={!depositForm.title || !depositForm.author}
              >
                Submit for Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {hasOverdueBooks && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
          You have overdue books. Please return them to continue borrowing.
        </div>
      )}

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Books</TabsTrigger>
          <TabsTrigger value="my-deposits">My Deposits</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableBooks.map((book) => (
              <Card key={book.id}>
                <CardHeader>
                  {book.image_url && (
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                  <CardDescription>{book.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Condition:</span>
                      <Badge variant="secondary">{book.condition}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Purchase Price:</span>
                      <span className="font-semibold">${book.price}</span>
                    </div>
                    {book.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {book.description}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleRequestBook(book.id, 'borrow')}
                    disabled={book.depositor_id === user?.id}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Borrow (2 weeks)
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleRequestBook(book.id, 'purchase')}
                    disabled={book.depositor_id === user?.id}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy ($5)
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {availableBooks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No books available for exchange yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-deposits">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myDeposits.map((book) => (
              <Card key={book.id}>
                <CardHeader>
                  {book.image_url && (
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                  <CardDescription>{book.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={
                          book.status === 'available'
                            ? 'default'
                            : book.status === 'pending_approval'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {book.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Condition:</span>
                      <span>{book.condition}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {myDeposits.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven't deposited any books yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-requests">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTransactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardHeader>
                  {transaction.exchange_books.image_url && (
                    <img
                      src={transaction.exchange_books.image_url}
                      alt={transaction.exchange_books.title}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <CardTitle className="line-clamp-1">
                    {transaction.exchange_books.title}
                  </CardTitle>
                  <CardDescription>{transaction.exchange_books.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">{transaction.transaction_type}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={
                          transaction.status === 'active'
                            ? 'default'
                            : transaction.status === 'pending_approval'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {transaction.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {transaction.loan_due_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>
                          {new Date(transaction.loan_due_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {myTransactions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven't requested any books yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
