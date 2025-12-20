import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export function BookCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[2/3] bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-16 mt-2" />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 6, type = 'product' }: { count?: number; type?: 'product' | 'book' }) {
  const SkeletonComponent = type === 'book' ? BookCardSkeleton : ProductCardSkeleton;
  
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
