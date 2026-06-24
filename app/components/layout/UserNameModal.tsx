import { useState, type FormEvent } from "react";

type UserNameModalProps = {
  onSubmit: (name: string) => void;
};

export function UserNameModal({ onSubmit }: UserNameModalProps) {
  const [name, setName] = useState("");

  // Manejar el envío del formulario
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-name-modal-title"
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-8"
      >
        <h2
          id="user-name-modal-title"
          className="mt-1 text-xl text-center font-semibold"
        >
          ¿Cómo te llamas?
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="user-name" className="sr-only">
              Nombre
            </label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tu nombre"
              autoFocus
              required
              className="w-full rounded-lg border focus:outline-none border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}
