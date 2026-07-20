import Link from "next/link";
import { Button } from "../ui/button";
import { ChevronRight, FileUp, Map } from "lucide-react";

export function OrderActions() {
    return (
        <div className="space-y-4">
            <Link href="/client/orders/new">
                <Button size="lg" className="w-full justify-between h-16">
                    <div className="flex items-center gap-3">
                        <FileUp className="h-5 w-5" />
                        <span className="text-base">Create New Order</span>
                    </div>
                    <ChevronRight className="h-5 w-5 rtl:rotate-180" />
                </Button>
            </Link>
             <Link href="/client/tracking">
                <Button size="lg" variant="outline" className="w-full justify-between h-16">
                    <div className="flex items-center gap-3">
                        <Map className="h-5 w-5" />
                        <span className="text-base">Live Tracking</span>
                    </div>
                    <ChevronRight className="h-5 w-5 rtl:rotate-180" />
                </Button>
            </Link>
        </div>
    )
}
