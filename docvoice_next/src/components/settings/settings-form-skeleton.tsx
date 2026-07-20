
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SettingsFormSkeleton() {
    return (
        <Card className="mb-8">
            <CardHeader>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-10">
                    <Skeleton className="h-40 w-40 rounded-full" />
                    <div className="flex-1 space-y-2 w-full">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-11 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-11 w-full" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <div className="space-y-3 mt-4">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Skeleton className="h-14 w-40" />
                </div>
            </CardContent>
        </Card>
    )
}
