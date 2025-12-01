import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, Plus } from 'lucide-react';

interface Transfer {
  id: string;
  sender_full_name: string;
  receiver_full_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function Transfers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTransfers();
  }, [user, navigate]);

  const fetchTransfers = async () => {
    const { data } = await supabase
      .from('money_transfers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTransfers(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'declined': return 'destructive';
      default: return 'outline';
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
      <div className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl font-bold text-foreground">My Transfers</h1>
            <p className="text-muted-foreground mt-2">View your money transfer history</p>
          </div>
          <Button asChild>
            <Link to="/transfer">
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Link>
          </Button>
        </div>

        {transfers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Send className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">No transfers yet</p>
              <Button className="mt-4" asChild>
                <Link to="/transfer">Make Your First Transfer</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transfers.map((transfer) => (
              <Card key={transfer.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      ${transfer.amount.toFixed(2)} USD
                    </CardTitle>
                    <Badge variant={getStatusColor(transfer.status)}>
                      {transfer.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">From</p>
                      <p className="font-medium">{transfer.sender_full_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">To</p>
                      <p className="font-medium">{transfer.receiver_full_name}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {new Date(transfer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
