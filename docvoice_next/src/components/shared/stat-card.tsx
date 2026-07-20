import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ElementType } from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ElementType;
  helperText: string;
}

export function StatCard({ title, value, icon: Icon, helperText }: StatCardProps) {
  return (
    <Card className="group hover:shadow-card-hover transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground/80">{title}</CardTitle>
        <div className="p-2 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground/70 mt-1">{helperText}</p>
      </CardContent>
    </Card>
  );
}
