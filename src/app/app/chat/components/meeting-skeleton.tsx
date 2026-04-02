import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MeetingSkeletonProps {
  className?: string;
}

export function MeetingSkeleton({ className }: MeetingSkeletonProps) {
  return (
    <div className={cn("relative w-full h-full bg-gray-950 flex flex-col overflow-hidden", className)}>
      {/* Header / Top Bar */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
           <Skeleton className="h-8 w-8 rounded-full bg-gray-800" />
           <Skeleton className="h-4 w-32 bg-gray-800" />
        </div>
        <div className="flex items-center gap-2">
           <Skeleton className="h-8 w-20 rounded-md bg-gray-800" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mock Participant 1 (Self) */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-20 h-20 rounded-full bg-gray-800" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Skeleton className="h-4 w-24 bg-gray-800" />
          </div>
        </div>

        {/* Mock Participant 2 */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-20 h-20 rounded-full bg-gray-800" />
          </div>
          <div className="absolute bottom-4 left-4">
             <Skeleton className="h-4 w-24 bg-gray-800" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-20 border-t border-gray-800 flex items-center justify-center gap-4">
         {[1, 2, 3, 4, 5].map((i) => (
             <Skeleton key={i} className="w-12 h-12 rounded-full bg-gray-800" />
         ))}
      </div>
      
      {/* Loading overlay for additional feedback */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
         <div className="px-4 py-2 bg-gray-900/80 rounded-full backdrop-blur-sm border border-gray-800 text-sm text-gray-300 animate-pulse">
            Preparando interface...
         </div>
      </div>
    </div>
  );
}