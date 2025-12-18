import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge = ({ count, className }: NotificationBadgeProps) => {
  if (count === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className={cn(
        "h-5 min-w-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5",
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};
