import { useEffect, useState, type ReactNode } from "react";
import { useLoaderData } from "react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  CircleDot,
  Clock,
  Inbox,
  PieChart as PieChartIcon,
  Sparkles,
  TrendingUp,
  UserX,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDatum, ReportsData } from "~/data/reports";

// ------------------------------------------------------------
// Paletas de color ligadas a los tokens del tema (light + dark)
// ------------------------------------------------------------
const statusColors: Record<string, string> = {
  ABIERTO: "var(--color-accent-info)",
  EN_PROGRESO: "var(--color-accent-warning)",
  RESUELTO: "var(--color-accent-success)",
  CERRADO: "var(--color-muted-foreground)",
};

const categoryColors: Record<string, string> = {
  FINANZAS: "var(--color-accent-success)",
  LEGAL: "var(--color-accent-violet)",
  COMPRAS: "var(--color-accent-warning)",
  OPERACIONES: "var(--color-accent-info)",
};

const priorityColors: Record<string, string> = {
  ALTA: "var(--color-accent-danger)",
  MEDIA: "var(--color-accent-warning)",
  BAJA: "var(--color-accent-success)",
};

const classificationColors: Record<string, string> = {
  PENDIENTE: "var(--color-accent-warning)",
  COMPLETADA: "var(--color-accent-success)",
  FALLIDA: "var(--color-accent-danger)",
};

const statTones = {
  default: {
    border: "border-l-foreground",
    icon: "bg-primary-subtle text-foreground",
  },
  info: {
    border: "border-l-accent-info",
    icon: "bg-accent-info-subtle text-accent-info",
  },
  warning: {
    border: "border-l-accent-warning",
    icon: "bg-accent-warning-subtle text-accent-warning",
  },
  success: {
    border: "border-l-accent-success",
    icon: "bg-accent-success-subtle text-accent-success",
  },
  danger: {
    border: "border-l-accent-danger",
    icon: "bg-accent-danger-subtle text-accent-danger",
  },
  violet: {
    border: "border-l-accent-violet",
    icon: "bg-accent-violet-subtle text-accent-violet",
  },
} as const;

type StatTone = keyof typeof statTones;

// ------------------------------------------------------------
// Evita render de los gráficos durante SSR
// ------------------------------------------------------------
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// Tooltip con estilo del tema para todos los gráficos
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: any }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {entry.payload?.label ?? entry.name}
            </span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Contenedor de tarjeta para cada gráfico
function ChartCard({
  title,
  description,
  icon: Icon,
  className,
  children,
}: {
  title: string;
  description?: string;
  icon: typeof BarChart3;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6",
        className ?? "",
      ].join(" ")}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-foreground">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// Esqueleto mientras el gráfico monta en cliente
function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="flex w-full animate-pulse items-center justify-center rounded-lg bg-primary-subtle/50"
      style={{ height }}
    >
      <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
    </div>
  );
}

// Estado vacío cuando no hay datos
function EmptyChart({ height }: { height: number }) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground"
      style={{ height }}
    >
      <Inbox className="h-7 w-7 opacity-50" />
      <p className="text-sm">Sin datos para mostrar</p>
    </div>
  );
}

// Tarjeta de gráfico de dona con leyenda lateral
function DonutCard({
  title,
  description,
  icon,
  data,
  colors,
  mounted,
}: {
  title: string;
  description?: string;
  icon: typeof BarChart3;
  data: ChartDatum[];
  colors: Record<string, string>;
  mounted: boolean;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const height = 220;

  return (
    <ChartCard title={title} description={description} icon={icon}>
      {!mounted ? (
        <ChartSkeleton height={height} />
      ) : total === 0 ? (
        <EmptyChart height={height} />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-4">
          <div
            className="relative mx-auto shrink-0"
            style={{ width: 200, height: 200 }}
          >
            <PieChart width={200} height={200}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx={100}
                cy={100}
                innerRadius={60}
                outerRadius={88}
                paddingAngle={data.length > 1 ? 2 : 0}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={colors[entry.key]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums">{total}</span>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
          </div>
          <ul className="w-full space-y-2">
            {data.map((entry) => {
              const pct = total === 0 ? 0 : Math.round((entry.value / total) * 100);
              return (
                <li key={entry.key} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colors[entry.key] }}
                  />
                  <span className="text-muted-foreground">{entry.label}</span>
                  <span className="ml-auto font-semibold tabular-nums">
                    {entry.value}
                  </span>
                  <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}

export function ReportsDashboard() {
  const { report } = useLoaderData<{ report: ReportsData }>();
  const mounted = useMounted();
  const { metrics, byStatus, byCategory, byPriority, byClassification, trend, workload } =
    report;

  const kpis: {
    label: string;
    value: string | number;
    hint: string;
    icon: typeof BarChart3;
    tone: StatTone;
  }[] = [
    {
      label: "Total tickets",
      value: metrics.total,
      hint: "Registrados en el sistema",
      icon: Inbox,
      tone: "default",
    },
    {
      label: "Tasa de resolución",
      value: `${metrics.tasaResolucion}%`,
      hint: `${metrics.resueltos} resueltos`,
      icon: TrendingUp,
      tone: "success",
    },
    {
      label: "En progreso",
      value: metrics.enProgreso,
      hint: "Activos ahora",
      icon: Clock,
      tone: "warning",
    },
    {
      label: "Abiertos",
      value: metrics.abiertos,
      hint: "Esperando gestión",
      icon: CircleDot,
      tone: "info",
    },
    {
      label: "Sin asignar",
      value: metrics.sinAsignar,
      hint: "Sin responsable",
      icon: UserX,
      tone: "danger",
    },
    {
      label: "Sin clasificar",
      value: metrics.sinClasificar,
      hint: "Pendientes de IA",
      icon: Sparkles,
      tone: "violet",
    },
  ];

  const categoryTotal = byCategory.reduce((sum, d) => sum + d.value, 0);
  const trendTotal = trend.reduce((sum, d) => sum + d.creados + d.resueltos, 0);
  const workloadMax = Math.max(1, ...workload.map((w) => w.total));

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="shrink-0">
        <h2 className="text-2xl font-bold tracking-tight">Reportes y métricas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visión general del desempeño operativo y la distribución de los tickets.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const tone = statTones[kpi.tone];
          return (
            <div
              key={kpi.label}
              className={[
                "rounded-xl border border-border border-l-4 bg-surface p-5 shadow-sm",
                tone.border,
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums">
                    {kpi.value}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {kpi.hint}
                  </p>
                </div>
                <span
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    tone.icon,
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tendencia + Estado */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Tendencia de tickets"
          description="Creados vs. resueltos en los últimos 6 meses"
          icon={Activity}
          className="lg:col-span-2"
        >
          {!mounted ? (
            <ChartSkeleton height={280} />
          ) : trendTotal === 0 ? (
            <EmptyChart height={280} />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="grad-creados" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-accent-info)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-accent-info)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="grad-resueltos" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-accent-success)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-accent-success)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="creados"
                    name="Creados"
                    stroke="var(--color-accent-info)"
                    strokeWidth={2}
                    fill="url(#grad-creados)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resueltos"
                    name="Resueltos"
                    stroke="var(--color-accent-success)"
                    strokeWidth={2}
                    fill="url(#grad-resueltos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-info" />
                  Creados
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-success" />
                  Resueltos
                </span>
              </div>
            </div>
          )}
        </ChartCard>

        <DonutCard
          title="Tickets por estado"
          description="Distribución del flujo operativo"
          icon={PieChartIcon}
          data={byStatus}
          colors={statusColors}
          mounted={mounted}
        />
      </div>

      {/* Categoría + Prioridad */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Tickets por categoría"
          description="Volumen por área funcional"
          icon={BarChart3}
          className="lg:col-span-2"
        >
          {!mounted ? (
            <ChartSkeleton height={260} />
          ) : categoryTotal === 0 ? (
            <EmptyChart height={260} />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byCategory}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-primary-subtle)", opacity: 0.5 }}
                    content={<ChartTooltip />}
                  />
                  <Bar dataKey="value" name="Tickets" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {byCategory.map((entry) => (
                      <Cell key={entry.key} fill={categoryColors[entry.key]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <DonutCard
          title="Tickets por prioridad"
          description="Nivel de urgencia asignado"
          icon={AlertTriangle}
          data={byPriority}
          colors={priorityColors}
          mounted={mounted}
        />
      </div>

      {/* Carga por responsable + Clasificación IA */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Carga por responsable"
          description="Tickets activos y resueltos por persona"
          icon={Users}
          className="lg:col-span-2"
        >
          {workload.length === 0 ? (
            <EmptyChart height={260} />
          ) : (
            <ul className="space-y-4">
              {workload.map((row) => {
                const widthPct = Math.round((row.total / workloadMax) * 100);
                const activosPct =
                  row.total === 0 ? 0 : (row.activos / row.total) * 100;
                return (
                  <li key={row.key}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{row.label}</span>
                      <span className="ml-3 shrink-0 tabular-nums text-muted-foreground">
                        {row.activos} activos · {row.resueltos} resueltos
                      </span>
                    </div>
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full bg-primary-subtle"
                      style={{ maxWidth: "100%" }}
                    >
                      <div
                        className="flex h-full"
                        style={{ width: `${widthPct}%` }}
                      >
                        <span
                          className="h-full bg-accent-warning"
                          style={{ width: `${activosPct}%` }}
                        />
                        <span
                          className="h-full bg-accent-success"
                          style={{ width: `${100 - activosPct}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
              <li className="flex items-center gap-6 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-warning" />
                  Activos
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-success" />
                  Resueltos
                </span>
              </li>
            </ul>
          )}
        </ChartCard>

        <DonutCard
          title="Clasificación por IA"
          description="Estado del procesamiento automático"
          icon={CheckCircle}
          data={byClassification}
          colors={classificationColors}
          mounted={mounted}
        />
      </div>
    </div>
  );
}
