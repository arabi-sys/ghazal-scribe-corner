import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Category } from '@/lib/types';
import { FolderOpen } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link to={`/products?category=${category.slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
        <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FolderOpen className="h-16 w-16 text-primary/50 group-hover:text-primary transition-colors" />
            </div>
          )}
        </div>
        <CardContent className="p-4 text-center">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {category.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
