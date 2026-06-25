import type { Assignee } from "~/types/schema";
import { db } from "./database";
import { getErrorMessage, type Result } from "~/utils";

// Listar responsables registrados
export async function listAssignees(): Promise<Result<Assignee[]>> {
  try {
    const assignees = await db.assignee.findMany({
      orderBy: { name: "asc" },
    });
    return { ok: true, data: assignees };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}

// Buscar o crear un responsable por nombre
export async function findOrCreateAssignee(
  name: string,
): Promise<Result<Assignee>> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "El nombre del responsable es requerido", code: "VALIDATION" };
  }

  try {
    const assignee = await db.assignee.upsert({
      where: { name: trimmed },
      create: { name: trimmed },
      update: {},
    });
    return { ok: true, data: assignee };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}
