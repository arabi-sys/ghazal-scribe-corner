import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { createNotification } from '@/hooks/useNotifications';

interface ExchangeBook {
  id: string;
  title: string;
  author: string;
  condition: string;
  status: string;
  depositor_id: string;
  created_at: string;
}

interface ExchangeTransaction {
  id: string;
  book_id: string;
  user_id: string;
  transaction_type: string;
  status: string;
  created_at: string;
  offered_book_id?: string;
  exchange_books: ExchangeBook;
}

interface Props {
  books: ExchangeBook[];
  transactions: ExchangeTransaction[];
  onRefresh: () => void;
}

export function ExchangeBooksTab({ books, transactions, onRefresh }: Props) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);

  const pendingDeposits = books.filter((b) => b.status === 'pending_approval');
  const pendingTransactions = transactions.filter((t) => t.status === 'pending_approval');

  const handleApproveDeposit = async (book: ExchangeBook) => {
    setProcessing(book.id);
    try {
      const { error } = await supabase
        .from('exchange_books')
        .update({ status: 'available' })
        .eq('id', book.id);

      if (error) throw error;

      // Notify the depositor
      await createNotification(
        book.depositor_id,
        'deposit_approved',
        'Book Deposit Approved',
        `Your book "${book.title}" has been approved and is now available for exchange.`,
        book.id
      );

      toast({ title: 'Book deposit approved!' });
      onRefresh();
    } catch (error) {
      console.error('Error approving deposit:', error);
      toast({ title: 'Error approving deposit', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectDeposit = async (book: ExchangeBook) => {
    setProcessing(book.id);
    try {
      const { error } = await supabase
        .from('exchange_books')
        .update({ status: 'rejected' })
        .eq('id', book.id);

      if (error) throw error;

      // Notify the depositor
      await createNotification(
        book.depositor_id,
        'deposit_rejected',
        'Book Deposit Rejected',
        `Your book "${book.title}" has been rejected.`,
        book.id
      );

      toast({ title: 'Book deposit rejected' });
      onRefresh();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      toast({ title: 'Error rejecting deposit', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };


  const handleApproveTransaction = async (
    transaction: ExchangeTransaction
  ) => {
    setProcessing(transaction.id);
    try {
      const updates: any = { status: 'active' };

      // Set loan due date for exchanges (2 weeks)
      if (transaction.transaction_type === 'exchange') {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        updates.loan_due_date = dueDate.toISOString();
      }

      const { error: transactionError } = await supabase
        .from('exchange_transactions')
        .update(updates)
        .eq('id', transaction.id);

      if (transactionError) throw transactionError;

      // Update requested book status
      const newBookStatus = transaction.transaction_type === 'purchase' ? 'sold' : 'on_loan';
      const { error: bookError } = await supabase
        .from('exchange_books')
        .update({ status: newBookStatus })
        .eq('id', transaction.book_id);

      if (bookError) throw bookError;

      // If exchange, also update the offered book status
      if (transaction.transaction_type === 'exchange' && transaction.offered_book_id) {
        const { error: offeredBookError } = await supabase
          .from('exchange_books')
          .update({ status: 'on_loan' })
          .eq('id', transaction.offered_book_id);

        if (offeredBookError) throw offeredBookError;
      }

      // Notify the user
      const notificationType = transaction.transaction_type === 'exchange' ? 'exchange_approved' : 'purchase_approved';
      await createNotification(
        transaction.user_id,
        notificationType,
        `${transaction.transaction_type === 'exchange' ? 'Exchange' : 'Purchase'} Request Approved`,
        `Your ${transaction.transaction_type} request for "${transaction.exchange_books.title}" has been approved.`,
        transaction.book_id
      );

      toast({ title: `${transaction.transaction_type === 'exchange' ? 'Exchange' : 'Purchase'} approved!` });
      onRefresh();
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({ title: 'Error approving transaction', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectTransaction = async (transaction: ExchangeTransaction) => {
    setProcessing(transaction.id);
    try {
      const { error } = await supabase
        .from('exchange_transactions')
        .update({ status: 'rejected' })
        .eq('id', transaction.id);

      if (error) throw error;

      // Notify the user
      const notificationType = transaction.transaction_type === 'exchange' ? 'exchange_rejected' : 'purchase_rejected';
      await createNotification(
        transaction.user_id,
        notificationType,
        `${transaction.transaction_type === 'exchange' ? 'Exchange' : 'Purchase'} Request Rejected`,
        `Your ${transaction.transaction_type} request for "${transaction.exchange_books.title}" has been rejected.`,
        transaction.book_id
      );

      toast({ title: 'Request rejected' });
      onRefresh();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast({ title: 'Error rejecting transaction', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Book Deposits</CardTitle>
          <CardDescription>Review and approve books submitted by users</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDeposits.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending deposits</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDeposits.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{book.condition}</Badge>
                    </TableCell>
                    <TableCell>{new Date(book.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveDeposit(book)}
                          disabled={processing === book.id}
                        >
                          {processing === book.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectDeposit(book)}
                          disabled={processing === book.id}
                        >
                          {processing === book.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>Approve or reject exchange/purchase requests</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTransactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending requests</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.exchange_books.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.transaction_type === 'exchange' ? 'Exchange' : 'Purchase'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveTransaction(transaction)}
                          disabled={processing === transaction.id}
                        >
                          {processing === transaction.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectTransaction(transaction)}
                          disabled={processing === transaction.id}
                        >
                          {processing === transaction.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
