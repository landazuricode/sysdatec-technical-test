import {
  ClassificationStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "~/types/schema";
import { db } from "./database";
import { getErrorMessage, type Result } from "~/utils";

// ------------------------------------------------------------
// Tipos de reporte
// ------------------------------------------------------------
export type ReportMetrics = {
  total: number;
  abiertos: number;
  enProgreso: number;
  resueltos: number;
  sinAsignar: number;
  sinClasificar: number;
  tasaResolucion: number;
};

export type ChartDatum = {
  key: string;
  label: string;
  value: number;
};

export type TrendDatum = {
  key: string;
  label: string;
  creados: number;
  resueltos: number;
};

export type WorkloadDatum = {
  key: string;
  label: string;
  total: number;
  activos: number;
  resueltos: number;
};

export type ReportsData = {
  metrics: ReportMetrics;
  byStatus: ChartDatum[];
  byCategory: ChartDatum[];
  byPriority: ChartDatum[];
  byClassification: ChartDatum[];
  trend: TrendDatum[];
  workload: WorkloadDatum[];
};

const RESOLVED_STATUSES: TicketStatus[] = [
  TicketStatus.RESUELTO,
  TicketStatus.CERRADO,
];
const TREND_MONTHS = 6;
const WORKLOAD_LIMIT = 8;

const monthFormatter = new Intl.DateTimeFormat("es-CO", { month: "short" });

// Etiquetas legibles por dimensión
const statusLabels: Record<TicketStatus, string> = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

const categoryLabels: Record<TicketCategory, string> = {
  FINANZAS: "Finanzas",
  LEGAL: "Legal",
  COMPRAS: "Compras",
  OPERACIONES: "Operaciones",
};

const priorityLabels: Record<TicketPriority, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const classificationLabels: Record<ClassificationStatus, string> = {
  PENDIENTE: "Pendiente",
  COMPLETADA: "Completada",
  FALLIDA: "Fallida",
};

// Construir las claves de los últimos meses (incluye el mes actual)
function buildMonthKeys(months: number): { key: string; label: string }[] {
  const now = new Date();
  const keys: { key: string; label: string }[] = [];

  for (let offset = months - 1; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    keys.push({ key, label: monthFormatter.format(date) });
  }

  return keys;
}

// Clave de mes (YYYY-MM) a partir de una fecha
function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Obtener la distribución de tickets por estado
async function getStatusDistribution(): Promise<ChartDatum[]> {
  const grouped = await db.ticket.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts = new Map(grouped.map((row) => [row.status, row._count._all]));

  return (Object.keys(statusLabels) as TicketStatus[]).map((status) => ({
    key: status,
    label: statusLabels[status],
    value: counts.get(status) ?? 0,
  }));
}

// Obtener la distribución de tickets por categoría
async function getCategoryDistribution(): Promise<ChartDatum[]> {
  const grouped = await db.ticket.groupBy({
    by: ["category"],
    _count: { _all: true },
  });

  const counts = new Map(grouped.map((row) => [row.category, row._count._all]));

  return (Object.keys(categoryLabels) as TicketCategory[]).map((category) => ({
    key: category,
    label: categoryLabels[category],
    value: counts.get(category) ?? 0,
  }));
}

// Obtener la distribución de tickets por prioridad
async function getPriorityDistribution(): Promise<ChartDatum[]> {
  const grouped = await db.ticket.groupBy({
    by: ["priority"],
    _count: { _all: true },
  });

  const counts = new Map(grouped.map((row) => [row.priority, row._count._all]));

  return (Object.keys(priorityLabels) as TicketPriority[]).map((priority) => ({
    key: priority,
    label: priorityLabels[priority],
    value: counts.get(priority) ?? 0,
  }));
}

// Obtener la distribución por estado de clasificación de IA
async function getClassificationDistribution(): Promise<ChartDatum[]> {
  const grouped = await db.ticket.groupBy({
    by: ["classificationStatus"],
    _count: { _all: true },
  });

  const counts = new Map(
    grouped.map((row) => [row.classificationStatus, row._count._all]),
  );

  return (Object.keys(classificationLabels) as ClassificationStatus[]).map(
    (status) => ({
      key: status,
      label: classificationLabels[status],
      value: counts.get(status) ?? 0,
    }),
  );
}

// Obtener la tendencia mensual de tickets creados y resueltos
async function getMonthlyTrend(): Promise<TrendDatum[]> {
  const months = buildMonthKeys(TREND_MONTHS);
  const since = new Date();
  since.setMonth(since.getMonth() - (TREND_MONTHS - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [created, resolved] = await Promise.all([
    db.ticket.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.ticket.findMany({
      where: {
        status: { in: RESOLVED_STATUSES },
        updatedAt: { gte: since },
      },
      select: { updatedAt: true },
    }),
  ]);

  const createdByMonth = new Map<string, number>();
  for (const ticket of created) {
    const key = toMonthKey(ticket.createdAt);
    createdByMonth.set(key, (createdByMonth.get(key) ?? 0) + 1);
  }

  const resolvedByMonth = new Map<string, number>();
  for (const ticket of resolved) {
    const key = toMonthKey(ticket.updatedAt);
    resolvedByMonth.set(key, (resolvedByMonth.get(key) ?? 0) + 1);
  }

  return months.map(({ key, label }) => ({
    key,
    label,
    creados: createdByMonth.get(key) ?? 0,
    resueltos: resolvedByMonth.get(key) ?? 0,
  }));
}

// Obtener la carga de trabajo por responsable (incluye no asignados)
async function getAssigneeWorkload(): Promise<WorkloadDatum[]> {
  const [assignees, unassigned] = await Promise.all([
    db.assignee.findMany({
      include: { tickets: { select: { status: true } } },
    }),
    db.ticket.findMany({
      where: { assigneeId: null },
      select: { status: true },
    }),
  ]);

  const isResolved = (status: TicketStatus) =>
    RESOLVED_STATUSES.includes(status);

  const rows: WorkloadDatum[] = assignees.map((assignee) => {
    const total = assignee.tickets.length;
    const resueltos = assignee.tickets.filter((t) =>
      isResolved(t.status),
    ).length;
    return {
      key: assignee.id,
      label: assignee.name,
      total,
      activos: total - resueltos,
      resueltos,
    };
  });

  if (unassigned.length > 0) {
    const resueltos = unassigned.filter((t) => isResolved(t.status)).length;
    rows.push({
      key: "unassigned",
      label: "Sin asignar",
      total: unassigned.length,
      activos: unassigned.length - resueltos,
      resueltos,
    });
  }

  return rows
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, WORKLOAD_LIMIT);
}

// Obtener las métricas principales del reporte
async function getReportMetrics(): Promise<ReportMetrics> {
  const [total, abiertos, enProgreso, resueltos, sinAsignar, sinClasificar] =
    await Promise.all([
      db.ticket.count(),
      db.ticket.count({ where: { status: TicketStatus.ABIERTO } }),
      db.ticket.count({ where: { status: TicketStatus.EN_PROGRESO } }),
      db.ticket.count({ where: { status: { in: RESOLVED_STATUSES } } }),
      db.ticket.count({ where: { assigneeId: null } }),
      db.ticket.count({
        where: { classificationStatus: ClassificationStatus.PENDIENTE },
      }),
    ]);

  const tasaResolucion = total === 0 ? 0 : Math.round((resueltos / total) * 100);

  return {
    total,
    abiertos,
    enProgreso,
    resueltos,
    sinAsignar,
    sinClasificar,
    tasaResolucion,
  };
}

// Obtener todos los datos consolidados para el módulo de reportes
export async function getReportsData(): Promise<Result<ReportsData>> {
  try {
    const [
      metrics,
      byStatus,
      byCategory,
      byPriority,
      byClassification,
      trend,
      workload,
    ] = await Promise.all([
      getReportMetrics(),
      getStatusDistribution(),
      getCategoryDistribution(),
      getPriorityDistribution(),
      getClassificationDistribution(),
      getMonthlyTrend(),
      getAssigneeWorkload(),
    ]);

    return {
      ok: true,
      data: {
        metrics,
        byStatus,
        byCategory,
        byPriority,
        byClassification,
        trend,
        workload,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}
