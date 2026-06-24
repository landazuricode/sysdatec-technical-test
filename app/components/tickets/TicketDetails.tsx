import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { Sparkles } from "lucide-react";
import {
  TicketStatus,
  type ClassificationStatus,
  type TicketCategory,
  type TicketPriority,
} from "~/types/schema";
import type { SerializedComment, SerializedTicket } from "~/utils/serializers";

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

type TicketDetailsProps = {
  ticket: SerializedTicket;
};

type ActionData =
  | { ok: true; intent: string }
  | { ok: false; error: string; intent: string };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function TicketDetails() {
  const { ticket } = useLoaderData<{ ticket: SerializedTicket }>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const canRetryClassification =
    ticket.classificationStatus === "FALLIDA" ||
    ticket.classificationStatus === "PENDIENTE";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>
        <h2 className="mt-1 text-2xl font-semibold">{ticket.clientName}</h2>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Clasificación IA
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {classificationStatusLabels[ticket.classificationStatus]}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estado
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {ticketStatusLabels[ticket.status]}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Categoría
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {ticket.category
                ? ticketCategoryLabels[ticket.category]
                : "Sin clasificar"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prioridad
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {ticket.priority
                ? ticketPriorityLabels[ticket.priority]
                : "Sin clasificar"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Responsable
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {ticket.assignee ?? "Sin asignar"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Creado
            </dt>
            <dd className="mt-1 text-sm">{formatDate(ticket.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Actualizado
            </dt>
            <dd className="mt-1 text-sm">{formatDate(ticket.updatedAt)}</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium">Solicitud</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {ticket.requestText}
            </p>
          </div>

          {ticket.summary && (
            <div>
              <h3 className="text-sm font-medium">Resumen IA</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {ticket.summary}
              </p>
            </div>
          )}

          {ticket.classificationStatus === "FALLIDA" &&
            ticket.classificationError && (
              <div className="rounded-lg border border-accent-danger/30 bg-accent-danger-subtle px-4 py-3">
                <h3 className="text-sm font-medium text-accent-danger">
                  Error de clasificación
                </h3>
                <p className="mt-1 text-sm text-accent-danger/90">
                  {ticket.classificationError}
                </p>
              </div>
            )}

          {canRetryClassification && (
            <Form method="post">
              <input type="hidden" name="intent" value="retryClassification" />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-subtle disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {isSubmitting ? "Clasificando..." : "Reintentar clasificación IA"}
              </button>
            </Form>
          )}

          {ticket.attachmentUrl && (
            <div>
              <h3 className="text-sm font-medium">Adjunto</h3>
              <a
                href={ticket.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-accent-info underline"
              >
                Ver archivo adjunto
              </a>
            </div>
          )}
        </div>
      </div>

      {actionData && !actionData.ok && (
        <p className="rounded-lg border border-accent-danger/30 bg-accent-danger-subtle px-4 py-3 text-sm text-accent-danger">
          {actionData.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Form
          method="post"
          className="rounded-xl border border-border bg-surface p-6"
        >
          <input type="hidden" name="intent" value="updateStatus" />
          <h3 className="text-sm font-semibold">Actualizar estado</h3>
          <select
            name="status"
            defaultValue={ticket.status}
            className="mt-4 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
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
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            Guardar estado
          </button>
        </Form>

        <Form
          method="post"
          className="rounded-xl border border-border bg-surface p-6"
        >
          <input type="hidden" name="intent" value="updateAssignee" />
          <h3 className="text-sm font-semibold">Asignar responsable</h3>
          <input
            name="assignee"
            type="text"
            defaultValue={ticket.assignee ?? ""}
            placeholder="Nombre del responsable"
            className="mt-4 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            Guardar responsable
          </button>
        </Form>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold">Comentarios</h3>

        {ticket.comments && ticket.comments.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {ticket.comments.map((comment: SerializedComment) => (
              <li
                key={comment.id}
                className="rounded-lg border border-border bg-primary-subtle/30 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{comment.author ?? "Anónimo"}</span>
                  <time dateTime={comment.createdAt}>
                    {formatDate(comment.createdAt)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {comment.content}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Aún no hay comentarios en este ticket.
          </p>
        )}

        <Form method="post" className="mt-6 space-y-4 border-t border-border pt-6">
          <input type="hidden" name="intent" value="addComment" />
          <div>
            <label htmlFor="author" className="block text-sm font-medium">
              Autor{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="author"
              name="author"
              type="text"
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium">
              Comentario
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={3}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
              placeholder="Escribe un comentario..."
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            Agregar comentario
          </button>
        </Form>
      </div>
    </div>
  );
}
