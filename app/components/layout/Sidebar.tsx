import { Link, NavLink } from "react-router";
import {
  APP_NAME,
  APP_DESCRIPTION,
} from "~/config/constants";
import { CountBadge } from "~/components/ui/CountBadge";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Inbox,
  LayoutDashboard,
  Minus,
  Plus,
  Scale,
  Settings,
  ShoppingCart,
  Ticket,
  Wallet,
} from "lucide-react";

// Links de tickets
const ticketLinks = [
  { to: "/", label: "Panel", icon: LayoutDashboard, end: true },
  { to: "/tickets/new", label: "Nuevo ticket", icon: Ticket, end: false },
] as const;

// Estados de tickets
const ticketStatuses = [
  { label: "Todos", count: 0, icon: Inbox, tone: "default" as const },
  { label: "Abiertos", count: 0, icon: CircleDot, tone: "info" as const },
  { label: "En progreso", count: 0, icon: Clock, tone: "warning" as const },
  { label: "Resueltos", count: 0, icon: CheckCircle, tone: "success" as const },
];

// Prioridades de tickets
const ticketPriorities = [
  { label: "Alta", count: 0, icon: AlertTriangle, tone: "danger" as const },
  { label: "Media", count: 0, icon: Minus, tone: "warning" as const },
  { label: "Baja", count: 0, icon: CircleDot, tone: "success" as const },
];

// Categorías de tickets
const ticketCategories = [
  { label: "Finanzas", count: 0, icon: Wallet, tone: "success" as const },
  { label: "Legal", count: 0, icon: Scale, tone: "violet" as const },
  { label: "Compras", count: 0, icon: ShoppingCart, tone: "warning" as const },
  { label: "Operaciones", count: 0, icon: Settings, tone: "info" as const },
];

type SidebarProps = {
  isCollapsed: boolean;
  onCollapseToggle: () => void;
  onNavigate?: () => void;
};

// Clases de tono de iconos
const iconToneClasses = {
  default: "text-foreground",
  info: "text-accent-info",
  warning: "text-accent-warning",
  success: "text-accent-success",
  danger: "text-accent-danger",
  violet: "text-accent-violet",
} as const;

// Clases de fondo de iconos
const iconBgClasses = {
  default: "bg-primary-subtle",
  info: "bg-accent-info-subtle",
  warning: "bg-accent-warning-subtle",
  success: "bg-accent-success-subtle",
  danger: "bg-accent-danger-subtle",
  violet: "bg-accent-violet-subtle",
} as const;

type FilterItem = {
  label: string;
  count: number;
  icon: LucideIcon;
  tone: keyof typeof iconToneClasses;
};

// Clases de enlace de navegación
function navLinkClass({ isActive }: { isActive: boolean }, isCollapsed: boolean) {
  return [
    "flex items-center rounded-lg text-sm font-medium transition-colors",
    isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-foreground hover:bg-primary-subtle",
  ].join(" ");
}

// Fila de filtros
function FilterRow({
  item,
  isCollapsed,
}: {
  item: FilterItem;
  isCollapsed: boolean;
}) {
  const Icon = item.icon;

  if (isCollapsed) {
    return (
      <button
        type="button"
        title={`${item.label} (${item.count})`}
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-primary-subtle"
      >
        <Icon className={["h-4 w-4", iconToneClasses[item.tone]].join(" ")} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary-subtle"
    >
      <span
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          iconBgClasses[item.tone],
        ].join(" ")}
      >
        <Icon className={["h-3.5 w-3.5", iconToneClasses[item.tone]].join(" ")} />
      </span>
      <span className="flex-1 text-left">{item.label}</span>
      <CountBadge count={item.count} tone={item.tone} />
    </button>
  );
}

// Sección de filtros
function FilterSection({
  title,
  items,
  isCollapsed,
}: {
  title: string;
  items: FilterItem[];
  isCollapsed: boolean;
}) {
  return (
    <div className={isCollapsed ? "mt-4" : "mt-8"}>
      {!isCollapsed && (
        <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </p>
      )}
      <ul className={isCollapsed ? "space-y-1" : "space-y-0.5"}>
        {items.map((item) => (
          <li key={item.label}>
            <FilterRow item={item} isCollapsed={isCollapsed} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar({ isCollapsed, onCollapseToggle, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={[
          "flex h-16 shrink-0 border-b border-border",
          isCollapsed
            ? "items-center justify-center px-2"
            : "items-center justify-between px-4",
        ].join(" ")}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={onCollapseToggle}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-primary-subtle lg:inline-flex"
            aria-label="Expandir menú"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <>
            <Link
              to="/"
              onClick={onNavigate}
              className="flex min-w-0 items-center gap-3"
            >
              <img
                src="/favicon.ico"
                alt={APP_NAME}
                className="h-9 w-9 shrink-0 rounded-lg object-contain ring-1 ring-border"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-wide uppercase">
                  {APP_NAME}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {APP_DESCRIPTION}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={onCollapseToggle}
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-primary-subtle lg:inline-flex"
              aria-label="Contraer menú"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <Link
          to="/tickets/new"
          onClick={onNavigate}
          title={isCollapsed ? "Abrir ticket" : undefined}
          className={[
            "mb-6 flex items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover",
            isCollapsed
              ? "mx-auto h-9 w-9 justify-center"
              : "w-full justify-center gap-2 px-4 py-2.5",
          ].join(" ")}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Abrir ticket</span>}
        </Link>

        <nav aria-label="Tickets">
          {!isCollapsed && (
            <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Tickets
            </p>
          )}
          <ul className="space-y-1">
            {ticketLinks.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  title={isCollapsed ? label : undefined}
                  className={({ isActive }) => navLinkClass({ isActive }, isCollapsed)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span>{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <FilterSection
          title="Estados"
          items={ticketStatuses}
          isCollapsed={isCollapsed}
        />
        <FilterSection
          title="Prioridades"
          items={ticketPriorities}
          isCollapsed={isCollapsed}
        />
        <FilterSection
          title="Categorías"
          items={ticketCategories}
          isCollapsed={isCollapsed}
        />
      </div>
    </div>
  );
}
