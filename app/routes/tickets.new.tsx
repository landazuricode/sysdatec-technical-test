import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/tickets.new";
import { APP_NAME } from "~/config/constants";
import { createTicket } from "~/data/tickets";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Nuevo ticket | ${APP_NAME}` },
    { name: "description", content: "Crear un nuevo ticket" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const result = await createTicket({
    clientName: String(formData.get("clientName") ?? ""),
    requestText: String(formData.get("requestText") ?? ""),
    attachmentUrl: String(formData.get("attachmentUrl") ?? "") || null,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      error: result.error,
      code: result.code,
      values: {
        clientName: String(formData.get("clientName") ?? ""),
        requestText: String(formData.get("requestText") ?? ""),
        attachmentUrl: String(formData.get("attachmentUrl") ?? ""),
      },
    };
  }

  return redirect(`/tickets/${result.data.id}`);
}

export default function TicketsNewRoute() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-lg font-semibold">Crear ticket</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Registra una solicitud con el nombre del cliente, el detalle y un adjunto
        opcional.
      </p>

      {actionData && !actionData.ok && (
        <p className="mt-4 rounded-lg border border-accent-danger/30 bg-accent-danger-subtle px-4 py-3 text-sm text-accent-danger">
          {actionData.error}
        </p>
      )}

      <Form method="post" className="mt-6 space-y-5">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium">
            Nombre del cliente
          </label>
          <input
            id="clientName"
            name="clientName"
            type="text"
            required
            defaultValue={actionData?.values?.clientName ?? ""}
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground"
            placeholder="Ej. Acme Corp"
          />
        </div>

        <div>
          <label htmlFor="requestText" className="block text-sm font-medium">
            Solicitud
          </label>
          <textarea
            id="requestText"
            name="requestText"
            required
            rows={5}
            defaultValue={actionData?.values?.requestText ?? ""}
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground"
            placeholder="Describe la solicitud operativa..."
          />
        </div>

        <div>
          <label htmlFor="attachmentUrl" className="block text-sm font-medium">
            URL de adjunto{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="attachmentUrl"
            name="attachmentUrl"
            type="url"
            defaultValue={actionData?.values?.attachmentUrl ?? ""}
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground"
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? "Creando..." : "Crear ticket"}
        </button>
      </Form>
    </div>
  );
}
