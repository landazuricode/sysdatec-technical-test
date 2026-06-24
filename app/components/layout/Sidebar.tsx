import { Link, NavLink, useSearchParams } from "react-router";
import {
  APP_NAME,
  APP_DESCRIPTION,
} from "~/config/constants";
import { CountBadge } from "~/components/ui/CountBadge";
import type { SidebarFilterCounts } from "~/data/tickets";
import {
  buildTicketListUrl,
} from "~/utils";
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "~/types/schema";
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

const ticketLinks = [
  { to: "/", label: "Panel", icon: LayoutDashboard, end: true },
  { to: "/tickets/new", label: "Nuevo ticket", icon: Ticket, end: false },
] as const;

type SidebarProps = {
  sidebarCounts: SidebarFilterCounts;
  isCollapsed: boolean;
  onCollapseToggle: () => void;
  onNavigate?: () => void;
};

// Clases de iconos
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

// Clases de filas de filtros activos
const activeFilterRowClasses = {
  default: "bg-primary-subtle text-foreground ring-1 ring-inset ring-border",
  info: "bg-accent-info-subtle text-accent-info ring-1 ring-inset ring-accent-info/30",
  warning:
    "bg-accent-warning-subtle text-accent-warning ring-1 ring-inset ring-accent-warning/30",
  success:
    "bg-accent-success-subtle text-accent-success ring-1 ring-inset ring-accent-success/30",
  danger:
    "bg-accent-danger-subtle text-accent-danger ring-1 ring-inset ring-accent-danger/30",
  violet:
    "bg-accent-violet-subtle text-accent-violet ring-1 ring-inset ring-accent-violet/30",
} as const;

type FilterItem = {
  label: string;
  count: number;
  icon: LucideIcon;
  tone: keyof typeof iconToneClasses;
  to: string;
  isActive: boolean;
};

// Clases de enlaces de navegación
function navLinkClass({ isActive }: { isActive: boolean }, isCollapsed: boolean) {
  return [
    "flex items-center rounded-lg text-sm font-medium transition-colors",
    isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-foreground hover:bg-primary-subtle",
  ].join(" ");
}

// Fila de filtro
function FilterRow({
  item,
  isCollapsed,
  onNavigate,
}: {
  item: FilterItem;
  isCollapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const activeClasses = activeFilterRowClasses[item.tone];
  const inactiveClasses = "text-foreground hover:bg-primary-subtle";

  if (isCollapsed) {
    return (
      <Link
        to={item.to}
        onClick={onNavigate}
        title={`${item.label} (${item.count})`}
        className={[
          "mx-auto flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          item.isActive ? activeClasses : inactiveClasses,
        ].join(" ")}
      >
        <Icon className={["h-4 w-4", iconToneClasses[item.tone]].join(" ")} />
      </Link>
    );
  }

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={[
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        item.isActive ? activeClasses : inactiveClasses,
      ].join(" ")}
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
    </Link>
  );
}

function FilterSection({
  title,
  items,
  isCollapsed,
  onNavigate,
}: {
  title: string;
  items: FilterItem[];
  isCollapsed: boolean;
  onNavigate?: () => void;
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
            <FilterRow
              item={item}
              isCollapsed={isCollapsed}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar({
  sidebarCounts,
  isCollapsed,
  onCollapseToggle,
  onNavigate,
}: SidebarProps) {
  const [searchParams] = useSearchParams();
  const activeStatus = searchParams.get("status");
  const activePriority = searchParams.get("priority");
  const activeCategory = searchParams.get("category");

  const statusFilters: FilterItem[] = [
    {
      label: "Todos",
      count: sidebarCounts.status.todos,
      icon: Inbox,
      tone: "default",
      to: buildTicketListUrl(searchParams, { status: null }),
      isActive: !activeStatus,
    },
    {
      label: "Abiertos",
      count: sidebarCounts.status.abiertos,
      icon: CircleDot,
      tone: "info",
      to: buildTicketListUrl(searchParams, { status: TicketStatus.ABIERTO }),
      isActive: activeStatus === TicketStatus.ABIERTO,
    },
    {
      label: "En progreso",
      count: sidebarCounts.status.enProgreso,
      icon: Clock,
      tone: "warning",
      to: buildTicketListUrl(searchParams, { status: TicketStatus.EN_PROGRESO }),
      isActive: activeStatus === TicketStatus.EN_PROGRESO,
    },
    {
      label: "Resueltos",
      count: sidebarCounts.status.resueltos,
      icon: CheckCircle,
      tone: "success",
      to: buildTicketListUrl(searchParams, { status: "RESUELTOS" }),
      isActive: activeStatus === "RESUELTOS",
    },
  ];

  const priorityFilters: FilterItem[] = [
    {
      label: "Alta",
      count: sidebarCounts.priority.alta,
      icon: AlertTriangle,
      tone: "danger",
      to: buildTicketListUrl(searchParams, { priority: TicketPriority.ALTA }),
      isActive: activePriority === TicketPriority.ALTA,
    },
    {
      label: "Media",
      count: sidebarCounts.priority.media,
      icon: Minus,
      tone: "warning",
      to: buildTicketListUrl(searchParams, { priority: TicketPriority.MEDIA }),
      isActive: activePriority === TicketPriority.MEDIA,
    },
    {
      label: "Baja",
      count: sidebarCounts.priority.baja,
      icon: CircleDot,
      tone: "success",
      to: buildTicketListUrl(searchParams, { priority: TicketPriority.BAJA }),
      isActive: activePriority === TicketPriority.BAJA,
    },
  ];

  const categoryFilters: FilterItem[] = [
    {
      label: "Finanzas",
      count: sidebarCounts.category.finanzas,
      icon: Wallet,
      tone: "success",
      to: buildTicketListUrl(searchParams, { category: TicketCategory.FINANZAS }),
      isActive: activeCategory === TicketCategory.FINANZAS,
    },
    {
      label: "Legal",
      count: sidebarCounts.category.legal,
      icon: Scale,
      tone: "violet",
      to: buildTicketListUrl(searchParams, { category: TicketCategory.LEGAL }),
      isActive: activeCategory === TicketCategory.LEGAL,
    },
    {
      label: "Compras",
      count: sidebarCounts.category.compras,
      icon: ShoppingCart,
      tone: "warning",
      to: buildTicketListUrl(searchParams, { category: TicketCategory.COMPRAS }),
      isActive: activeCategory === TicketCategory.COMPRAS,
    },
    {
      label: "Operaciones",
      count: sidebarCounts.category.operaciones,
      icon: Settings,
      tone: "info",
      to: buildTicketListUrl(searchParams, {
        category: TicketCategory.OPERACIONES,
      }),
      isActive: activeCategory === TicketCategory.OPERACIONES,
    },
  ];

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
          items={statusFilters}
          isCollapsed={isCollapsed}
          onNavigate={onNavigate}
        />
        <FilterSection
          title="Prioridades"
          items={priorityFilters}
          isCollapsed={isCollapsed}
          onNavigate={onNavigate}
        />
        <FilterSection
          title="Categorías"
          items={categoryFilters}
          isCollapsed={isCollapsed}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
