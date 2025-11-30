import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CategoryCard } from '@/components/products/CategoryCard';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (data) setCategories(data as Category[]);
      setLoading(false);
    }

    fetchCategories();
  }, []);

  return (
    <Layout>
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-2">Browse our product categories</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
