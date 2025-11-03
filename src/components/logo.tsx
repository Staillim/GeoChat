import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="p-2 bg-primary rounded-lg">
        <MapPin className="h-5 w-5 text-primary-foreground" />
      </div>
      <h1 className="font-headline font-bold text-xl">LocalConnect</h1>
    </div>
  );
}
