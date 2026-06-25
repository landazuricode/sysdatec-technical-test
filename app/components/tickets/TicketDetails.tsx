import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import { MarkdownContent } from "~/components/ui/MarkdownContent";
import {
  TicketStatus,
  type ClassificationStatus,
  type TicketCategory,
  type TicketPriority,
} from "~/types/schema";
import type { SerializedComment, SerializedTicket } from "~/utils/serializers";
import { formatDate } from "~/utils";

const classificationStatusLabels: Record<ClassificationStatus, string> = {
  PENDIENTE: "Pendiente",
  COMPLETADA: "Completada",
  FALLIDA: "Fallida",
};

const ticketStatusLabels: Record<keyof typeof TicketStatus, string> = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

const ticketCategoryLabels: Record<TicketCategory, string> = {
  FINANZAS: "Finanzas",
  LEGAL: "Legal",
  COMPRAS: "Compras",
  OPERACIONES: "Operaciones",
};

const ticketPriorityLabels: Record<TicketPriority, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const ticketStatusOptions = Object.values(TicketStatus).map((value) => ({
  value,
  label: ticketStatusLabels[value],
}));

const fieldInputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-primary-subtle/40 px-4 py-2.5 text-sm outline-none transition-[border-color,background-color] duration-200 placeholder:text-muted-foreground focus:border-foreground/20 focus:bg-background focus:outline-none focus:ring-2 focus:ring-foreground/5 focus-visible:outline-none";

const panelClass = "rounded-lg border border-border bg-surface shadow-sm";

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-border py-3 text-sm last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  );
}

type ActionData =
  | { ok: true; intent: string }
  | { ok: false; error: string; intent: string };

export function TicketDetails() {
  const { ticket } = useLoaderData<{ ticket: SerializedTicket }>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const canRetryClassification =
    ticket.classificationStatus === "FALLIDA" ||
    ticket.classificationStatus === "PENDIENTE";

  return (
    <div className="w-full">
      <Link
        to="/"
        className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        ← Volver a tickets
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className={panelClass}>
          {actionData && !actionData.ok && (
            <div
              role="alert"
              className="border-b border-accent-danger/30 bg-accent-danger-subtle px-6 py-3 text-sm text-accent-danger"
            >
              {actionData.error}
            </div>
          )}

          <header className="border-b border-border px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Ticket #{ticket.id}
                </p>
                <h2 className="mt-0.5 text-xl font-semibold tracking-tight">
                  {ticket.clientName}
                </h2>
              </div>
              <dl className="shrink-0 space-y-1 text-sm sm:text-right">
                <div>
                  <dt className="inline text-muted-foreground after:content-[':'] sm:block sm:after:content-none">
                    Creado
                  </dt>{" "}
                  <dd className="inline font-medium sm:block">
                    <time dateTime={ticket.createdAt}>
                      {formatDate(ticket.createdAt, { dateStyle: "medium" })}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className="inline text-muted-foreground after:content-[':'] sm:block sm:after:content-none">
                    Actualizado
                  </dt>{" "}
                  <dd className="inline font-medium sm:block">
                    <time dateTime={ticket.updatedAt}>
                      {formatDate(ticket.updatedAt, { dateStyle: "medium" })}
                    </time>
                  </dd>
                </div>
              </dl>
            </div>
          </header>

          <div className="space-y-6 px-6 py-5">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Solicitud
              </h3>
              <div className="mt-3 text-sm leading-relaxed">
                <MarkdownContent content={ticket.requestText} />
              </div>
            </section>

            {ticket.summary && (
              <section className="border-l-2 border-border pl-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resumen
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {ticket.summary}
                </p>
              </section>
            )}

            {ticket.classificationStatus === "FALLIDA" &&
              ticket.classificationError && (
                <div className="border border-accent-danger/30 bg-accent-danger-subtle px-4 py-3 text-sm">
                  <p className="font-medium text-accent-danger">
                    Clasificación no completada
                  </p>
                  <p className="mt-1 text-accent-danger/90">
                    {ticket.classificationError}
                  </p>
                </div>
              )}

            {ticket.attachmentUrl && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Adjunto
                </h3>
                <a
                  href={ticket.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-foreground underline underline-offset-2 hover:text-muted-foreground"
                >
                  {ticket.attachmentUrl}
                </a>
              </section>
            )}

            {canRetryClassification && (
              <Form method="post">
                <input type="hidden" name="intent" value="retryClassification" />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-sm font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Procesando clasificación..."
                    : "Reintentar clasificación"}
                </button>
              </Form>
            )}
          </div>

          <section className="border-t border-border">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comentarios
                {ticket.comments && ticket.comments.length > 0 && (
                  <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/80">
                    ({ticket.comments.length})
                  </span>
                )}
              </h3>
            </div>

            {ticket.comments && ticket.comments.length > 0 ? (
              <ul className="divide-y divide-border">
                {ticket.comments.map((comment: SerializedComment) => (
                  <li key={comment.id} className="px-6 py-4">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {comment.author ?? "Sin autor"}
                      </span>
                      <span className="mx-1.5">·</span>
                      <time dateTime={comment.createdAt}>
                        {formatDate(comment.createdAt, { dateStyle: "medium" })}
                      </time>
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                      {comment.content}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-6 py-5 text-sm text-muted-foreground">
                No hay comentarios registrados.
              </p>
            )}

            <Form
              method="post"
              className="space-y-4 border-t border-border bg-primary-subtle/25 px-6 py-4"
            >
              <input type="hidden" name="intent" value="addComment" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="author" className="text-sm font-medium">
                    Autor
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      Opcional
                    </span>
                  </label>
                  <input
                    id="author"
                    name="author"
                    type="text"
                    autoComplete="off"
                    className={fieldInputClass}
                    placeholder="Nombre"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="content" className="text-sm font-medium">
                  Comentario
                </label>
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={3}
                  autoComplete="off"
                  className={fieldInputClass}
                  placeholder="Registre el avance o la resolución..."
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  {isSubmitting ? "Guardando..." : "Agregar comentario"}
                </button>
              </div>
            </Form>
          </section>
        </div>

        <aside className="space-y-4">
          <div className={`${panelClass} p-5`}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Propiedades
            </h4>
            <dl className="mt-1">
              <PropertyRow label="Estado">
                {ticketStatusLabels[ticket.status]}
              </PropertyRow>
              <PropertyRow label="Categoría">
                {ticket.category
                  ? ticketCategoryLabels[ticket.category]
                  : "—"}
              </PropertyRow>
              <PropertyRow label="Prioridad">
                {ticket.priority
                  ? ticketPriorityLabels[ticket.priority]
                  : "—"}
              </PropertyRow>
              <PropertyRow label="Clasificación">
                <span
                  className={
                    ticket.classificationStatus === "FALLIDA"
                      ? "text-accent-danger"
                      : undefined
                  }
                >
                  {classificationStatusLabels[ticket.classificationStatus]}
                </span>
              </PropertyRow>
              <PropertyRow label="Responsable">
                {ticket.assignee ?? "Sin asignar"}
              </PropertyRow>
            </dl>
          </div>

          <div className={`${panelClass} p-5`}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Actualizar estado
            </h4>
            <Form method="post" className="mt-4">
              <input type="hidden" name="intent" value="updateStatus" />
              <label htmlFor="status" className="sr-only">
                Estado del ticket
              </label>
              <select
                id="status"
                name="status"
                autoComplete="off"
                defaultValue={ticket.status}
                className={fieldInputClass}
              >
                {ticketStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                Guardar
              </button>
            </Form>
          </div>

          <div className={`${panelClass} p-5`}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Asignar responsable
            </h4>
            <Form method="post" className="mt-4">
              <input type="hidden" name="intent" value="updateAssignee" />
              <label htmlFor="assignee" className="sr-only">
                Responsable
              </label>
              <input
                id="assignee"
                name="assignee"
                type="text"
                autoComplete="off"
                defaultValue={ticket.assignee ?? ""}
                placeholder="Nombre del responsable"
                className={fieldInputClass}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-subtle disabled:opacity-60"
              >
                Guardar
              </button>
            </Form>
          </div>
        </aside>
      </div>
    </div>
  );
}
