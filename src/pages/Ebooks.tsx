import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Search, Book, BookOpen } from 'lucide-react';

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

      setPurchasedIds([...purchasedIds, ebook.id]);
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
        <div className="container flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEbooks.map((ebook) => {
            const isPurchased = purchasedIds.includes(ebook.id);
            
            return (
              <Card key={ebook.id} className="group overflow-hidden flex flex-col">
                <div className="aspect-[2/3] bg-muted relative overflow-hidden">
                  {ebook.cover_url ? (
                    <img
                      src={ebook.cover_url}
                      alt={ebook.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Book className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  {ebook.is_free && (
                    <Badge className="absolute top-2 right-2 bg-green-500">Free</Badge>
                  )}
                </div>
                <CardContent className="p-4 flex-1">
                  <h3 className="font-serif font-semibold line-clamp-2">{ebook.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{ebook.author}</p>
                  {ebook.genre && (
                    <Badge variant="outline" className="mt-2">{ebook.genre}</Badge>
                  )}
                  {ebook.pages && (
                    <p className="text-xs text-muted-foreground mt-2">{ebook.pages} pages</p>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex items-center justify-between">
                  <span className="font-bold text-lg">
                    {ebook.is_free ? 'Free' : `$${ebook.price.toFixed(2)}`}
                  </span>
                  {isPurchased ? (
                    <Button size="sm" asChild>
                      <Link to={`/read/${ebook.id}`}>Read</Link>
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => handlePurchase(ebook)}
                      disabled={purchasing === ebook.id}
                    >
                      {purchasing === ebook.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {ebook.is_free ? 'Get Free' : 'Buy'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
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
