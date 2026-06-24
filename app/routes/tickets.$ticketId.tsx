import { Form, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/tickets.$ticketId";
import { APP_NAME } from "~/config/constants";
import {
  ticketCategoryLabels,
  ticketPriorityLabels,
  ticketStatusLabels,
  ticketStatusOptions,
} from "~/config/ticket-labels";
import { addComment } from "~/data/comments";
import { serializeTicket } from "~/data/serializers";
import {
  getTicketById,
  updateTicketAssignee,
  updateTicketStatus,
} from "~/data/tickets";

export function meta({ loaderData }: Route.MetaArgs) {
  const title = loaderData?.ticket
    ? `${loaderData.ticket.clientName} | ${APP_NAME}`
    : `Detalle del ticket | ${APP_NAME}`;

  return [
    { title },
    { name: "description", content: "Ver y gestionar un ticket" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const result = await getTicketById(params.ticketId);

  if (!result.ok) {
    if (result.code === "NOT_FOUND") {
      throw new Response(result.error, { status: 404 });
    }
    throw new Response(result.error, { status: 500 });
  }

  return { ticket: serializeTicket(result.data) };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "updateStatus") {
    const result = await updateTicketStatus(
      params.ticketId,
      String(formData.get("status") ?? ""),
    );

    if (!result.ok) {
      return { ok: false as const, error: result.error, intent };
    }

    return { ok: true as const, intent };
  }

  if (intent === "updateAssignee") {
    const result = await updateTicketAssignee(
      params.ticketId,
      String(formData.get("assignee") ?? "") || null,
    );

    if (!result.ok) {
      return { ok: false as const, error: result.error, intent };
    }

    return { ok: true as const, intent };
  }

  if (intent === "addComment") {
    const result = await addComment({
      ticketId: params.ticketId,
      content: String(formData.get("content") ?? ""),
      author: String(formData.get("author") ?? "") || null,
    });

    if (!result.ok) {
      return { ok: false as const, error: result.error, intent };
    }

    return { ok: true as const, intent };
  }

  return {
    ok: false as const,
    error: "Acción no reconocida",
    intent: "unknown",
  };
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function TicketDetailRoute({ loaderData }: Route.ComponentProps) {
  const { ticket } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>
        <h2 className="mt-1 text-2xl font-semibold">{ticket.clientName}</h2>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
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
            {ticket.comments.map((comment) => (
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
