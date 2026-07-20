export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="relative mb-6">
          <span className="material-icons animate-spin text-6xl text-primary">refresh</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        </div>
        <h2 className="text-2xl font-black italic text-primary mb-2">Sootnote</h2>
        <p className="text-slate-600 font-medium">{message}</p>
      </div>
    </div>
  );
}
