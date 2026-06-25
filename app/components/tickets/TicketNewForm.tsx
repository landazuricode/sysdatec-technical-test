import { useEffect, useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { Loader2 } from "lucide-react";

type ActionData = {
  ok: false;
  error: string;
  code: string;
  values: {
    clientName: string;
    requestText: string;
    attachmentUrl: string;
  };
};

const fieldInputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-primary-subtle/40 px-4 py-3 text-sm outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-foreground/20 focus:bg-background focus:outline-none focus:ring-2 focus:ring-foreground/5 focus-visible:outline-none";

const processSteps = [
  "Registro de la solicitud en el sistema",
  "Clasificación automática por categoría y prioridad",
  "Disponible para asignación y seguimiento",
];

const guidelines = [
  "Indique el nombre legal o comercial del cliente.",
  "Describa la solicitud con contexto, fechas y referencias.",
  "Adjunte un enlace a documentación de soporte si está disponible.",
];

export function TicketNewForm() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [clientName, setClientName] = useState(
    actionData?.values?.clientName ?? "",
  );
  const [requestText, setRequestText] = useState(
    actionData?.values?.requestText ?? "",
  );

  useEffect(() => {
    if (actionData?.values) {
      setClientName(actionData.values.clientName);
      setRequestText(actionData.values.requestText);
    }
  }, [actionData]);

  const canSubmit =
    clientName.trim().length > 0 && requestText.trim().length > 0;

  return (
    <div className="mx-auto p-0 w-full">
      <header className="mb-3 w-full">
        <h2 className="text-2xl font-bold tracking-tight">
          Registro de solicitud
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Complete los campos requeridos para crear un ticket. El sistema
          procesará la clasificación al confirmar el envío.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          {actionData && !actionData.ok && (
            <div
              role="alert"
              className="border-b border-accent-danger/30 bg-accent-danger-subtle px-6 py-3 text-sm text-accent-danger"
            >
              {actionData.error}
            </div>
          )}

          <Form method="post">
            <div className="space-y-4 px-6 py-5">
              <div>
                <label htmlFor="clientName" className="text-sm font-medium">
                  Nombre del cliente
                  <span className="ml-1 text-accent-danger">*</span>
                </label>
                <input
                  id="clientName"
                  name="clientName"
                  type="text"
                  autoComplete="off"
                  required
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  className={fieldInputClass}
                  placeholder="Ej. Acme Corp S.A."
                />
              </div>

              <div>
                <label htmlFor="requestText" className="text-sm font-medium">
                  Solicitud
                  <span className="ml-1 text-accent-danger">*</span>
                </label>
                <textarea
                  id="requestText"
                  name="requestText"
                  required
                  rows={6}
                  autoComplete="off"
                  value={requestText}
                  onChange={(event) => setRequestText(event.target.value)}
                  className={`${fieldInputClass} resize-y`}
                  placeholder="Describa el requerimiento, antecedentes y acción esperada..."
                />
              </div>

              <div>
                <label htmlFor="attachmentUrl" className="text-sm font-medium">
                  URL de adjunto
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    Opcional
                  </span>
                </label>
                <input
                  id="attachmentUrl"
                  name="attachmentUrl"
                  type="url"
                  defaultValue={actionData?.values?.attachmentUrl ?? ""}
                  className={fieldInputClass}
                  placeholder="https://..."
                  autoComplete="off"
                />
              </div>
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-border bg-primary-subtle/25 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-background"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Procesando solicitud...
                  </>
                ) : (
                  "Registrar ticket"
                )}
              </button>
            </footer>
          </Form>
        </div>

        <aside className="space-y-4 lg:pt-0">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Flujo de trabajo
            </h4>
            <ol className="mt-4 space-y-3">
              {processSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-primary-subtle text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="leading-snug text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-border bg-primary-subtle/30 p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lineamientos
            </h4>
            <ul className="mt-4 space-y-2.5">
              {guidelines.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-snug text-muted-foreground before:mt-2 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-muted-foreground/60 before:content-['']"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Los campos marcados con{" "}
            <span className="text-accent-danger">*</span> son obligatorios.
          </p>
        </aside>
      </div>
    </div>
  );
}
