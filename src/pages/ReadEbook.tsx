import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Book } from 'lucide-react';

interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  content_url: string | null;
  pages: number | null;
  genre: string | null;
}

export default function ReadEbook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkAccessAndFetch();
  }, [user, id, navigate]);

  const checkAccessAndFetch = async () => {
    // Check if user has purchased this ebook
    const { data: purchase } = await supabase
      .from('user_ebooks')
      .select('id')
      .eq('ebook_id', id)
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!purchase) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setHasAccess(true);

    // Fetch ebook details
    const { data: ebookData } = await supabase
      .from('ebooks')
      .select('*')
      .eq('id', id)
      .single();

    if (ebookData) setEbook(ebookData);
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

  if (!hasAccess) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <Book className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have access to this ebook. Please purchase it first.
          </p>
          <Button asChild>
            <Link to="/ebooks">Browse Ebooks</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (!ebook) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold">Ebook not found</h1>
          <Button className="mt-4" asChild>
            <Link to="/my-ebooks">Back to Library</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/my-ebooks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div className="md:col-span-1">
            <Card className="overflow-hidden">
              <div className="aspect-[2/3] bg-muted">
                {ebook.cover_url ? (
                  <img
                    src={ebook.cover_url}
                    alt={ebook.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Book className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Book Details & Reader */}
          <div className="md:col-span-2">
            <h1 className="font-serif text-3xl font-bold">{ebook.title}</h1>
            <p className="text-lg text-muted-foreground mt-1">by {ebook.author}</p>
            
            {ebook.genre && (
              <p className="text-sm text-muted-foreground mt-2">Genre: {ebook.genre}</p>
            )}
            {ebook.pages && (
              <p className="text-sm text-muted-foreground">Pages: {ebook.pages}</p>
            )}

            {ebook.description && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <h2 className="font-semibold mb-2">Description</h2>
                  <p className="text-muted-foreground">{ebook.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Reading Content Area */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Start Reading</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p>
                    Thank you for purchasing "{ebook.title}" by {ebook.author}.
                  </p>
                  <p className="mt-4">
                    This is a preview of your ebook reader. In a full implementation, 
                    the complete book content would be displayed here with features like:
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li>• Page navigation</li>
                    <li>• Bookmarking</li>
                    <li>• Font size adjustment</li>
                    <li>• Progress tracking</li>
                    <li>• Night mode</li>
                  </ul>
                  <p className="mt-4 text-sm">
                    The ebook content would be securely streamed from our servers 
                    to ensure copyright protection.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
