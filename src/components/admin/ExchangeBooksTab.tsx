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

  const handleApproveDeposit = async (bookId: string) => {
    setProcessing(bookId);
    try {
      const { error } = await supabase
        .from('exchange_books')
        .update({ status: 'available' })
        .eq('id', bookId);

      if (error) throw error;

      toast({ title: 'Book deposit approved!' });
      onRefresh();
    } catch (error) {
      console.error('Error approving deposit:', error);
      toast({ title: 'Error approving deposit', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectDeposit = async (bookId: string) => {
    setProcessing(bookId);
    try {
      const { error } = await supabase
        .from('exchange_books')
        .update({ status: 'rejected' })
        .eq('id', bookId);

      if (error) throw error;

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
    transactionId: string,
    transactionType: string,
    bookId: string
  ) => {
    setProcessing(transactionId);
    try {
      const updates: any = { status: 'active' };

      // Set loan due date for borrows (2 weeks)
      if (transactionType === 'borrow') {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        updates.loan_due_date = dueDate.toISOString();
      }

      const { error: transactionError } = await supabase
        .from('exchange_transactions')
        .update(updates)
        .eq('id', transactionId);

      if (transactionError) throw transactionError;

      // Update book status
      const newBookStatus = transactionType === 'purchase' ? 'sold' : 'on_loan';
      const { error: bookError } = await supabase
        .from('exchange_books')
        .update({ status: newBookStatus })
        .eq('id', bookId);

      if (bookError) throw bookError;

      toast({ title: `${transactionType === 'borrow' ? 'Borrow' : 'Purchase'} approved!` });
      onRefresh();
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({ title: 'Error approving transaction', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectTransaction = async (transactionId: string) => {
    setProcessing(transactionId);
    try {
      const { error } = await supabase
        .from('exchange_transactions')
        .update({ status: 'rejected' })
        .eq('id', transactionId);

      if (error) throw error;

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
                          onClick={() => handleApproveDeposit(book.id)}
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
                          onClick={() => handleRejectDeposit(book.id)}
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
          <CardDescription>Approve or reject borrow/purchase requests</CardDescription>
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
                        {transaction.transaction_type === 'borrow' ? 'Borrow' : 'Purchase'}
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
                          onClick={() =>
                            handleApproveTransaction(
                              transaction.id,
                              transaction.transaction_type,
                              transaction.book_id
                            )
                          }
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
                          onClick={() => handleRejectTransaction(transaction.id)}
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
