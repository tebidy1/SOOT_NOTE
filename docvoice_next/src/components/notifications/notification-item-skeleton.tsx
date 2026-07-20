import { Skeleton } from "@/components/ui/skeleton";

export function NotificationItemSkeleton() {
    return (
        <div className="flex items-start gap-4 p-6">
            <Skeleton className="size-10 rounded-full shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </div>
        </div>
    )
}
