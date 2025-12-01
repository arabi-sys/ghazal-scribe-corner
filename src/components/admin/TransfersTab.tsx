import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MoneyTransfer } from '@/lib/types';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface TransfersTabProps {
  transfers: MoneyTransfer[];
  onRefresh: () => void;
}

export function TransfersTab({ transfers, onRefresh }: TransfersTabProps) {
  const handleUpdateTransferStatus = async (transferId: string, status: string) => {
    const { error } = await supabase.from('money_transfers').update({ status }).eq('id', transferId);
    if (error) toast.error('Failed to update transfer');
    else {
      toast.success('Transfer status updated');
      onRefresh();
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Transfers ({transfers.length})</h2>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map(t => (
              <TableRow key={t.id}>
                <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{t.sender_full_name}</TableCell>
                <TableCell>{t.receiver_full_name}</TableCell>
                <TableCell>${t.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={t.status === 'completed' ? 'default' : t.status === 'declined' ? 'destructive' : 'secondary'}>
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {t.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateTransferStatus(t.id, 'completed')}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateTransferStatus(t.id, 'declined')}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
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
