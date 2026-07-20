interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground/80">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
