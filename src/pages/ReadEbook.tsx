import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Book, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

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

  const handleDownloadEbook = async () => {
    if (ebook?.content_url) {
      try {
        // Extract file path from the URL
        const urlParts = ebook.content_url.split('/ebook-files/');
        const filePath = urlParts[urlParts.length - 1];
        
        // Create a signed URL for private bucket access
        const { data, error } = await supabase.storage
          .from('ebook-files')
          .createSignedUrl(filePath, 60); // 60 seconds expiry
        
        if (error) {
          console.error('Error creating signed URL:', error);
          // Fallback to direct URL if signed URL fails
          window.open(ebook.content_url, '_blank');
        } else if (data?.signedUrl) {
          // Create a temporary link and trigger download
          const link = document.createElement('a');
          link.href = data.signedUrl;
          link.download = `${ebook.title}.epub`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (err) {
        console.error('Download error:', err);
        // Fallback to direct URL
        window.open(ebook.content_url, '_blank');
      }
      setShowDownloadDialog(false);
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
                <h2 className="font-semibold mb-4">Get Your Ebook</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p>
                    Thank you for purchasing "{ebook.title}" by {ebook.author}.
                  </p>
                  {ebook.content_url ? (
                    <p className="mt-4">
                      Click the button below to download your ebook in EPUB format. 
                      You'll need an EPUB reader app to open and read the file.
                    </p>
                  ) : (
                    <p className="mt-4 text-amber-600">
                      The ebook file is not yet available. Please check back later or contact support.
                    </p>
                  )}
                </div>
                {ebook.content_url ? (
                  <Button 
                    className="mt-6"
                    onClick={() => setShowDownloadDialog(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Ebook
                  </Button>
                ) : (
                  <Button 
                    className="mt-6"
                    variant="secondary"
                    disabled
                  >
                    <Download className="h-4 w-4 mr-2" />
                    File Not Available
                  </Button>
                )}
              </CardContent>
            </Card>

            <AlertDialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Download EPUB File</AlertDialogTitle>
                  <AlertDialogDescription>
                    You need an EPUB reader app to read this ebook. Popular options include:
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>Apple Books (iOS/Mac)</li>
                      <li>Google Play Books (Android/iOS)</li>
                      <li>Adobe Digital Editions (Desktop)</li>
                      <li>Calibre (Desktop)</li>
                    </ul>
                    <p className="mt-3">
                      Do you wish to continue and download the EPUB file?
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDownloadEbook}>
                    Download
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </Layout>
  );
}
