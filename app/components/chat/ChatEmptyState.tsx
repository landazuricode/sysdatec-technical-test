import { Bot, ListTodo, PlusCircle, TrendingUp, UserCog } from "lucide-react";
import { APP_NAME } from "~/config/constants";

type Suggestion = {
  icon: typeof Bot;
  title: string;
  prompt: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: TrendingUp,
    title: "Estado general",
    prompt: "Dame un resumen del estado actual de los tickets.",
  },
  {
    icon: ListTodo,
    title: "Tickets críticos",
    prompt: "¿Qué tickets de prioridad ALTA siguen abiertos?",
  },
  {
    icon: PlusCircle,
    title: "Crear un ticket",
    prompt:
      "Crea un ticket para el cliente Acme S.A.: no pueden generar la factura del mes y necesitan ayuda urgente.",
  },
  {
    icon: UserCog,
    title: "Carga del equipo",
    prompt: "¿Cómo está repartida la carga de trabajo entre los responsables?",
  },
];

type ChatEmptyStateProps = {
  onPick: (prompt: string) => void;
};

export function ChatEmptyState({ onPick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-violet-subtle text-accent-violet">
        <Bot className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-xl font-bold tracking-tight">
        Copiloto de {APP_NAME}
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Consulta, crea y opera tickets con lenguaje natural. Puedo buscar,
        cambiar estados, asignar responsables, comentar y darte métricas.
      </p>

      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.title}
              type="button"
              onClick={() => onPick(s.prompt)}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-primary-subtle"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {s.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {s.prompt}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
