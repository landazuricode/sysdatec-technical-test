import { useLocation } from "react-router";
import { APP_VERSION } from "~/config/constants";
import { useTheme } from "~/hooks/useTheme";
import { Menu, Moon, Sun, X } from "lucide-react";

type TopBarProps = {
  userName: string | null;
  initials: string;
  onMobileMenuToggle: () => void;
  isMobileSidebarOpen: boolean;
};

// Obtener el título de la página
function getPageTitle(pathname: string) {
  if (pathname === "/") return "Panel de control";
  if (pathname === "/tickets/new") return "Nuevo ticket";
  if (pathname.startsWith("/tickets/")) return "Detalle del ticket";
  if (pathname === "/reports") return "Reportes";
  return "Tickets";
}

export function TopBar({
  userName,
  initials,
  onMobileMenuToggle,
  isMobileSidebarOpen,
}: TopBarProps) {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const pageTitle = getPageTitle(pathname);
  const isDark = theme === "dark";

  return (
    <header className="z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-primary-subtle lg:hidden"
          aria-label={isMobileSidebarOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isMobileSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        <div className="min-w-0">
          {userName && (
            <p className="truncate text-xs text-muted-foreground">
              Bienvenido, {userName}
            </p>
          )}
          <h1 className="truncate text-base font-semibold sm:text-lg">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground md:inline">
          v{APP_VERSION}
        </span>

        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-primary-subtle"
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {userName && (
          <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 sm:px-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
            <span className="max-w-24 truncate text-sm font-medium sm:max-w-none">
              {userName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
