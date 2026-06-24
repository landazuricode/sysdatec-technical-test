type TicketDetailProps = {
  ticketId: string;
};

export function TicketDetail({ ticketId }: TicketDetailProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <p className="text-sm text-muted-foreground">Ticket #{ticketId}</p>
      <h2 className="mt-1 text-lg font-semibold">Detalle del ticket</h2>
      <p className="mt-4 text-sm text-muted-foreground">
        Actualizar estado, responsable y comentarios.
      </p>
    </div>
  );
}
