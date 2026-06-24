type CountBadgeProps = {
  count: number;
  tone?: "default" | "info" | "warning" | "success" | "danger" | "violet";
};

// Clases de fondo de iconos
const toneClasses = {
  default: "bg-primary-subtle text-foreground",
  info: "bg-accent-info-subtle text-accent-info",
  warning: "bg-accent-warning-subtle text-accent-warning",
  success: "bg-accent-success-subtle text-accent-success",
  danger: "bg-accent-danger-subtle text-accent-danger",
  violet: "bg-accent-violet-subtle text-accent-violet",
} as const;

export function CountBadge({ count, tone = "default" }: CountBadgeProps) {
  return (
    <span
      className={[
        "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        toneClasses[tone],
      ].join(" ")}
    >
      {count}
    </span>
  );
}
