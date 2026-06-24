import { Loader2 } from "lucide-react";

export function PagePreloader() {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background"
      role="status"
      aria-live="polite"
      aria-label="Cargando"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
    </div>
  );
}
