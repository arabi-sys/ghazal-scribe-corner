import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { BookOpen, Upload, Repeat, ShoppingCart, Loader2, History, Inbox, Check, X, MessageCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { notifyAdmins, useNotifications, createNotification } from '@/hooks/useNotifications';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { ExchangeChat } from '@/components/exchange/ExchangeChat';

type User = {
  id: string;
};

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
  user_id: string;
  transaction_type: string;
  status: string;
  loan_due_date?: string;
  created_at: string;
  offered_book_id?: string;
  exchange_books: ExchangeBook;
  offered_book?: ExchangeBook;
}

export default function BookExchange() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getUnreadByTypes, markTypesAsRead } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [availableBooks, setAvailableBooks] = useState<ExchangeBook[]>([]);
  const [myDeposits, setMyDeposits] = useState<ExchangeBook[]>([]);
  const [myTransactions, setMyTransactions] = useState<ExchangeTransaction[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ExchangeTransaction[]>([]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [hasOverdueBooks, setHasOverdueBooks] = useState(false);
  const [exchangeDialogBook, setExchangeDialogBook] = useState<ExchangeBook | null>(null);
  const [selectedOfferBook, setSelectedOfferBook] = useState<string>('');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [chatTransaction, setChatTransaction] = useState<{ id: string; otherUserId: string } | null>(null);

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
          .select('*, exchange_books!exchange_transactions_book_id_fkey(*)')
          .eq('user_id', user?.id)
      ]);

      if (booksRes.data) setAvailableBooks(booksRes.data);
      if (depositsRes.data) {
        setMyDeposits(depositsRes.data);
        // Fetch incoming exchange requests for user's deposited books
        const depositIds = depositsRes.data.map(d => d.id);
        if (depositIds.length > 0) {
          const { data: incomingRes } = await supabase
            .from('exchange_transactions')
            .select('*, exchange_books!exchange_transactions_book_id_fkey(*)')
            .in('book_id', depositIds)
            .eq('transaction_type', 'exchange')
            .eq('status', 'pending_approval')
            .neq('user_id', user?.id);
          
          // Fetch offered book details for each request
          if (incomingRes && incomingRes.length > 0) {
            const offeredBookIds = incomingRes.map(r => r.offered_book_id).filter(Boolean);
            const { data: offeredBooks } = await supabase
              .from('exchange_books')
              .select('*')
              .in('id', offeredBookIds);
            
            const requestsWithOfferedBooks = incomingRes.map(req => ({
              ...req,
              offered_book: offeredBooks?.find(b => b.id === req.offered_book_id)
            }));
            setIncomingRequests(requestsWithOfferedBooks);
          } else {
            setIncomingRequests([]);
          }
        }
      }
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
      .eq('transaction_type', 'exchange')
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

      // Notify admins about new deposit
      await notifyAdmins(
        'book_deposit',
        'New Book Deposit',
        `"${depositForm.title}" by ${depositForm.author}`
      );

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

  const handleRequestBook = async (bookId: string, transactionType: 'exchange' | 'purchase', offeredBookId?: string) => {
    if (!user) return;

    if (hasOverdueBooks && transactionType === 'exchange') {
      toast({
        title: 'Cannot exchange books',
        description: 'You have overdue exchanges. Please return them first.',
        variant: 'destructive'
      });
      return;
    }

    if (transactionType === 'exchange' && !offeredBookId) {
      toast({
        title: 'Select a book to offer',
        description: 'You must offer one of your books to exchange.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase.from('exchange_transactions').insert({
        book_id: bookId,
        user_id: user.id,
        transaction_type: transactionType,
        status: 'pending_approval',
        offered_book_id: offeredBookId || null
      });

      if (error) throw error;

      // Notify admins about the request
      await notifyAdmins(
        transactionType === 'exchange' ? 'book_exchange_request' : 'book_purchase_request',
        `Book ${transactionType === 'exchange' ? 'Exchange' : 'Purchase'} Request`,
        `Request for book ID: ${bookId}`,
        bookId
      );

      toast({ title: `${transactionType === 'exchange' ? 'Exchange' : 'Purchase'} request submitted!` });
      fetchData();
    } catch (error) {
      console.error('Error requesting book:', error);
      toast({ title: 'Error submitting request', variant: 'destructive' });
    }
  };

  const handleApproveExchange = async (transaction: ExchangeTransaction) => {
    if (!user) return;
    setProcessingRequest(transaction.id);

    try {
      // Update transaction status to active
      const { error: transactionError } = await supabase
        .from('exchange_transactions')
        .update({
          status: 'active',
          loan_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .eq('id', transaction.id);

      if (transactionError) throw transactionError;

      // Update both books' status to 'on_loan'
      const { error: bookError } = await supabase
        .from('exchange_books')
        .update({ status: 'on_loan' })
        .in('id', [transaction.book_id, transaction.offered_book_id].filter(Boolean));

      if (bookError) throw bookError;

      // Notify the requester
      await createNotification(
        transaction.user_id,
        'exchange_approved',
        'Exchange Request Approved',
        `Your exchange request for "${transaction.exchange_books.title}" has been approved!`,
        transaction.id
      );

      toast({ title: 'Exchange approved!' });
      fetchData();
    } catch (error) {
      console.error('Error approving exchange:', error);
      toast({ title: 'Error approving exchange', variant: 'destructive' });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectExchange = async (transaction: ExchangeTransaction) => {
    if (!user) return;
    setProcessingRequest(transaction.id);

    try {
      // Update transaction status to rejected
      const { error } = await supabase
        .from('exchange_transactions')
        .update({ status: 'rejected' })
        .eq('id', transaction.id);

      if (error) throw error;

      // Notify the requester
      await createNotification(
        transaction.user_id,
        'exchange_rejected',
        'Exchange Request Rejected',
        `Your exchange request for "${transaction.exchange_books.title}" has been rejected.`,
        transaction.id
      );

      toast({ title: 'Exchange rejected' });
      fetchData();
    } catch (error) {
      console.error('Error rejecting exchange:', error);
      toast({ title: 'Error rejecting exchange', variant: 'destructive' });
    } finally {
      setProcessingRequest(null);
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
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-semibold text-foreground">Ghazal Library</span>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Book Exchange</h1>
          <p className="text-muted-foreground mt-2">
            Share your used books with others. Exchange for another book or purchase for $5.
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
                Submit your used book for approval. Once approved, others can exchange or purchase it.
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
          You have overdue exchanges. Please return them to continue exchanging.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        // Mark notifications as read when user views relevant tabs
        if (value === 'my-deposits') markTypesAsRead(['deposit_approved', 'deposit_rejected']);
        if (value === 'my-requests') markTypesAsRead(['exchange_approved', 'exchange_rejected', 'purchase_approved', 'purchase_rejected']);
      }} className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Books</TabsTrigger>
          <TabsTrigger value="incoming-requests" className="relative">
            <Inbox className="h-4 w-4 mr-2" />
            Incoming Requests
            {incomingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {incomingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-deposits" className="relative">
            My Deposits
            <NotificationBadge count={getUnreadByTypes(['deposit_approved', 'deposit_rejected'])} className="ml-2" />
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="relative">
            My Requests
            <NotificationBadge count={getUnreadByTypes(['exchange_approved', 'exchange_rejected', 'purchase_approved', 'purchase_rejected'])} className="ml-2" />
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
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
                    onClick={() => setExchangeDialogBook(book)}
                    disabled={book.depositor_id === user?.id || myDeposits.filter(d => d.status === 'available').length === 0}
                  >
                    <Repeat className="h-4 w-4 mr-2" />
                    Exchange
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

          {/* Exchange Book Dialog */}
          <Dialog open={!!exchangeDialogBook} onOpenChange={(open) => {
            if (!open) {
              setExchangeDialogBook(null);
              setSelectedOfferBook('');
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exchange Book</DialogTitle>
                <DialogDescription>
                  Select one of your available books to offer in exchange for "{exchangeDialogBook?.title}"
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label>Your book to offer</Label>
                <Select value={selectedOfferBook} onValueChange={setSelectedOfferBook}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a book to offer" />
                  </SelectTrigger>
                  <SelectContent>
                    {myDeposits
                      .filter((d) => d.status === 'available')
                      .map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} by {book.author}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {myDeposits.filter((d) => d.status === 'available').length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You need to deposit a book first before you can exchange.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setExchangeDialogBook(null);
                  setSelectedOfferBook('');
                }}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (exchangeDialogBook && selectedOfferBook) {
                      handleRequestBook(exchangeDialogBook.id, 'exchange', selectedOfferBook);
                      setExchangeDialogBook(null);
                      setSelectedOfferBook('');
                    }
                  }}
                  disabled={!selectedOfferBook}
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  Request Exchange
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="incoming-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Pending Exchange Requests
              </CardTitle>
              <CardDescription>
                Review and approve/reject exchange requests from other users for your deposited books
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incomingRequests.length > 0 ? (
                <div className="space-y-4">
                  {incomingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Their requested book (your book) */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">They want your book:</p>
                          <div className="flex gap-3">
                            {request.exchange_books.image_url && (
                              <img
                                src={request.exchange_books.image_url}
                                alt={request.exchange_books.title}
                                className="w-16 h-24 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-semibold">{request.exchange_books.title}</p>
                              <p className="text-sm text-muted-foreground">{request.exchange_books.author}</p>
                              <Badge variant="secondary" className="mt-1">{request.exchange_books.condition}</Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Their offered book */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">They're offering:</p>
                          {request.offered_book ? (
                            <div className="flex gap-3">
                              {request.offered_book.image_url && (
                                <img
                                  src={request.offered_book.image_url}
                                  alt={request.offered_book.title}
                                  className="w-16 h-24 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-semibold">{request.offered_book.title}</p>
                                <p className="text-sm text-muted-foreground">{request.offered_book.author}</p>
                                <Badge variant="secondary" className="mt-1">{request.offered_book.condition}</Badge>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No book info available</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          Requested on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChatTransaction({ id: request.id, otherUserId: request.user_id })}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectExchange(request)}
                            disabled={processingRequest === request.id}
                          >
                            {processingRequest === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveExchange(request)}
                            disabled={processingRequest === request.id}
                          >
                            {processingRequest === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Chat Panel */}
                      {chatTransaction?.id === request.id && (
                        <div className="mt-4">
                          <ExchangeChat
                            transactionId={request.id}
                            otherUserId={request.user_id}
                            onClose={() => setChatTransaction(null)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending exchange requests for your books.</p>
                </div>
              )}
            </CardContent>
          </Card>
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
                {transaction.transaction_type === 'exchange' && transaction.status === 'pending_approval' && (
                  <CardFooter className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setChatTransaction({ 
                        id: transaction.id, 
                        otherUserId: transaction.exchange_books.depositor_id 
                      })}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat with Owner
                    </Button>
                    {chatTransaction?.id === transaction.id && (
                      <ExchangeChat
                        transactionId={transaction.id}
                        otherUserId={transaction.exchange_books.depositor_id}
                        onClose={() => setChatTransaction(null)}
                      />
                    )}
                  </CardFooter>
                )}
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

        <TabsContent value="history" className="space-y-6">
          {/* Deposit History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Deposit History
              </CardTitle>
              <CardDescription>All books you have deposited</CardDescription>
            </CardHeader>
            <CardContent>
              {myDeposits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deposited On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myDeposits.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{book.condition}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              book.status === 'available'
                                ? 'default'
                                : book.status === 'sold'
                                ? 'outline'
                                : 'secondary'
                            }
                          >
                            {book.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(book.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No deposits yet</p>
              )}
            </CardContent>
          </Card>

          {/* Exchange/Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                Exchange & Purchase History
              </CardTitle>
              <CardDescription>All books you have exchanged or purchased</CardDescription>
            </CardHeader>
            <CardContent>
              {myTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead>Return Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.exchange_books?.title}
                        </TableCell>
                        <TableCell>{transaction.exchange_books?.author}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.transaction_type === 'exchange' ? 'Exchanged' : 'Purchased'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === 'active'
                                ? 'default'
                                : transaction.status === 'completed' || transaction.status === 'returned'
                                ? 'secondary'
                                : transaction.status === 'pending_approval'
                                ? 'outline'
                                : 'destructive'
                            }
                          >
                            {transaction.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {transaction.transaction_type === 'exchange' && transaction.loan_due_date ? (
                            <span className={
                              new Date(transaction.loan_due_date) < new Date() && transaction.status === 'active'
                                ? 'text-destructive font-semibold'
                                : ''
                            }>
                              {new Date(transaction.loan_due_date).toLocaleDateString()}
                              {new Date(transaction.loan_due_date) < new Date() && transaction.status === 'active' && ' (Overdue)'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No transactions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
