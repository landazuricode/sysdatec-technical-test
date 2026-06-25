import OpenAI from "openai";

let client: OpenAI | null = null;

// Obtener (o crear) el cliente de OpenAI
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no está configurada");
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

// Modelo configurado para el chat
export function getChatModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
