import { ReportsDashboard } from "~/components/reports/ReportsDashboard";
import { APP_NAME } from "~/config/constants";
import { getReportsData } from "~/data/reports";

export function meta() {
  return [
    { title: `Reportes | ${APP_NAME}` },
    {
      name: "description",
      content: "Reportes y métricas operativas de los tickets",
    },
  ];
}

export async function loader() {
  const result = await getReportsData();

  // Validar resultado de la consulta
  if (!result.ok) {
    throw new Response(result.error, { status: 500 });
  }

  return { report: result.data };
}

export default function Route() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ReportsDashboard />
    </div>
  );
}
