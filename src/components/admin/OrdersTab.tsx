import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/lib/types';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { createNotification } from '@/hooks/useNotifications';

interface OrdersTabProps {
  orders: Order[];
  onRefresh: () => void;
}

export function OrdersTab({ orders, onRefresh }: OrdersTabProps) {
  const handleUpdateOrderStatus = async (order: Order, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (error) toast.error('Failed to update order');
    else {
      // Notify user about order status change
      await createNotification(
        order.user_id,
        'order_status_update',
        `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Your order #${order.id.slice(0, 8)} has been ${status}.`,
        order.id
      );
      toast.success('Order status updated');
      onRefresh();
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    // First delete order items
    await supabase.from('order_items').delete().eq('order_id', orderId);
    // Then delete the order
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) toast.error('Failed to delete order');
    else {
      toast.success('Order deleted');
      onRefresh();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'shipped': return 'secondary';
      case 'confirmed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Orders ({orders.length})</h2>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Update Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-sm">{o.id.slice(0, 8)}</TableCell>
                <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                <TableCell><Badge variant={getStatusColor(o.status)}>{o.status}</Badge></TableCell>
                <TableCell>${o.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={(v) => handleUpdateOrderStatus(o, v)}>
                    <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete order #{o.id.slice(0, 8)}? This will also delete all order items.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteOrder(o.id)} 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
