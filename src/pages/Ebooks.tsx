import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Search, BookOpen, Book } from 'lucide-react';
import { notifyAdmins } from '@/hooks/useNotifications';
import { BookCard3D } from '@/components/products/BookCard3D';
import { ProductGridSkeleton } from '@/components/products/ProductCardSkeleton';
import { triggerBookConfetti } from '@/components/ui/confetti';

interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  price: number;
  is_free: boolean;
  genre: string | null;
  pages: number | null;
}

export default function Ebooks() {
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchEbooks();
    if (user) fetchPurchased();
  }, [user]);

  const fetchEbooks = async () => {
    const { data } = await supabase.from('ebooks').select('*').order('title');
    if (data) setEbooks(data);
    setLoading(false);
  };

  const fetchPurchased = async () => {
    const { data } = await supabase
      .from('user_ebooks')
      .select('ebook_id');
    if (data) setPurchasedIds(data.map(d => d.ebook_id));
  };

  const handlePurchase = async (ebook: Ebook) => {
    if (!user) {
      toast.error('Please sign in to purchase ebooks');
      return;
    }

    setPurchasing(ebook.id);
    try {
      const { error } = await supabase
        .from('user_ebooks')
        .insert({ user_id: user.id, ebook_id: ebook.id });

      if (error) throw error;

      // Notify admins about ebook purchase (if not free)
      if (!ebook.is_free) {
        await notifyAdmins(
          'ebook_purchase',
          'Ebook Purchased',
          `"${ebook.title}" - $${ebook.price.toFixed(2)}`,
          ebook.id
        );
      }

      setPurchasedIds([...purchasedIds, ebook.id]);
      triggerBookConfetti();
      toast.success(`"${ebook.title}" added to your library!`);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase ebook');
    } finally {
      setPurchasing(null);
    }
  };

  const genres = [...new Set(ebooks.map(e => e.genre).filter(Boolean))];

  const filteredEbooks = ebooks.filter(ebook => {
    const matchesSearch = ebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ebook.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || ebook.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="mb-8">
            <div className="h-10 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-5 w-64 bg-muted animate-pulse rounded" />
          </div>
          <ProductGridSkeleton count={6} type="book" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground">Ebook Library</h1>
          <p className="text-muted-foreground mt-2">
            Browse our collection of {ebooks.length} ebooks
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre} value={genre!}>{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* My Library Link */}
        {user && purchasedIds.length > 0 && (
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link to="/my-ebooks">
                <BookOpen className="h-4 w-4 mr-2" />
                My Library ({purchasedIds.length} books)
              </Link>
            </Button>
          </div>
        )}

        {/* Ebooks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEbooks.map((ebook) => {
            const isPurchased = purchasedIds.includes(ebook.id);
            
            return (
              <BookCard3D
                key={ebook.id}
                id={ebook.id}
                title={ebook.title}
                author={ebook.author}
                coverUrl={ebook.cover_url}
                price={ebook.price}
                isFree={ebook.is_free}
                genre={ebook.genre}
                pages={ebook.pages}
                isPurchased={isPurchased}
                isPurchasing={purchasing === ebook.id}
                onPurchase={() => handlePurchase(ebook)}
                readLink={`/read/${ebook.id}`}
              />
            );
          })}
        </div>

        {filteredEbooks.length === 0 && (
          <div className="text-center py-12">
            <Book className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No ebooks found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
