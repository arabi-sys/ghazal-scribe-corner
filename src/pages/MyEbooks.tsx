import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Book, BookOpen } from 'lucide-react';

interface PurchasedEbook {
  id: string;
  ebook_id: string;
  purchased_at: string;
  ebooks: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
    pages: number | null;
  };
}

export default function MyEbooks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState<PurchasedEbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMyEbooks();
  }, [user, navigate]);

  const fetchMyEbooks = async () => {
    const { data } = await supabase
      .from('user_ebooks')
      .select('*, ebooks(*)')
      .order('purchased_at', { ascending: false });
    
    if (data) setEbooks(data as unknown as PurchasedEbook[]);
    setLoading(false);
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
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground">My Library</h1>
          <p className="text-muted-foreground mt-2">
            {ebooks.length} books in your collection
          </p>
        </div>

        {ebooks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Book className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">Your library is empty</p>
              <Button className="mt-4" asChild>
                <Link to="/ebooks">Browse Ebooks</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ebooks.map((item) => (
              <Card key={item.id} className="group overflow-hidden">
                <div className="aspect-[2/3] bg-muted relative overflow-hidden">
                  {item.ebooks.cover_url ? (
                    <img
                      src={item.ebooks.cover_url}
                      alt={item.ebooks.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Book className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-serif font-semibold line-clamp-2">{item.ebooks.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.ebooks.author}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Added {new Date(item.purchased_at).toLocaleDateString()}
                  </p>
                  <Button className="w-full mt-4" asChild>
                    <Link to={`/read/${item.ebook_id}`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Read Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
