import { useState, type FormEvent } from "react";
const MODAL_EXIT_MS = 220;

type UserNameModalProps = {
  onSubmit: (name: string) => void;
};

export function UserNameModal({ onSubmit }: UserNameModalProps) {
  const [name, setName] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  // Cerrar el modal
  const closeModal = (trimmedName: string) => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      onSubmit(trimmedName);
      return;
    }

    setIsClosing(true);
    window.setTimeout(() => onSubmit(trimmedName), MODAL_EXIT_MS);
  };

  // Manejar el envío del formulario
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isClosing) return;
    closeModal(trimmed);
  };

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
        isClosing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in",
      ].join(" ")}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-name-modal-title"
        className={[
          "w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-8",
          isClosing ? "animate-modal-dialog-out" : "animate-modal-dialog-in",
        ].join(" ")}
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
              autoComplete="off"
              className="w-full rounded-xl border border-border bg-primary-subtle/40 px-4 py-3 text-sm outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-foreground/20 focus:bg-background focus:outline-none focus:ring-2 focus:ring-foreground/5 focus-visible:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isClosing}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}
