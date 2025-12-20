import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookCard3DProps {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  price: number;
  isFree?: boolean;
  genre?: string | null;
  pages?: number | null;
  isPurchased?: boolean;
  isPurchasing?: boolean;
  onPurchase?: () => void;
  readLink?: string;
}

export function BookCard3D({
  id,
  title,
  author,
  coverUrl,
  price,
  isFree = false,
  genre,
  pages,
  isPurchased = false,
  isPurchasing = false,
  onPurchase,
  readLink,
}: BookCard3DProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="group perspective-1000"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={cn(
          "relative w-full transition-transform duration-700 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front - Book Cover with 3D effect */}
        <Card className="overflow-hidden backface-hidden glass-card">
          <div className="relative aspect-[2/3] bg-muted overflow-hidden book-3d">
            <div className="book-cover">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Book className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {isFree && (
              <Badge className="absolute top-2 right-2 bg-green-500 animate-pulse">Free</Badge>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-serif font-semibold line-clamp-2 transition-colors group-hover:text-primary">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{author}</p>
            {genre && (
              <Badge variant="outline" className="mt-2">{genre}</Badge>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0 flex items-center justify-between">
            <span className="font-bold text-lg">
              {isFree ? 'Free' : `$${price.toFixed(2)}`}
            </span>
            {isPurchased ? (
              <Button size="sm" className="btn-micro" asChild>
                <Link to={readLink || `/read/${id}`}>Read</Link>
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="btn-micro"
                onClick={onPurchase}
                disabled={isPurchasing}
              >
                {isPurchasing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isFree ? 'Get Free' : 'Buy'}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Back - Book Details */}
        <Card 
          className={cn(
            "absolute inset-0 overflow-hidden backface-hidden rotate-y-180 glass-card",
            "flex flex-col justify-center p-6"
          )}
        >
          <div className="text-center space-y-4">
            <h3 className="font-serif font-bold text-lg">{title}</h3>
            <p className="text-muted-foreground">by {author}</p>
            {pages && (
              <p className="text-sm text-muted-foreground">{pages} pages</p>
            )}
            {genre && <Badge variant="secondary">{genre}</Badge>}
            <div className="pt-4">
              <span className="text-2xl font-bold text-primary">
                {isFree ? 'Free' : `$${price.toFixed(2)}`}
              </span>
            </div>
            {isPurchased ? (
              <Button className="w-full btn-micro" asChild>
                <Link to={readLink || `/read/${id}`}>Read Now</Link>
              </Button>
            ) : (
              <Button 
                className="w-full btn-micro"
                onClick={onPurchase}
                disabled={isPurchasing}
              >
                {isPurchasing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isFree ? 'Add to Library' : 'Purchase Now'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
