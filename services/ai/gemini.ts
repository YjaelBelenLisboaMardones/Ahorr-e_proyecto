import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/app/lib/env";
import type { Mensaje } from "@/types/chat";
import type { PayloadGrounding } from "@/types/scraper";

const genAI = new GoogleGenerativeAI(env.gemini.apiKey);

function getModel() {
  return genAI.getGenerativeModel({ model: env.gemini.model });
}

/**
 * Chat con historial. El caller pasa el historial ya en orden cronológico
 * (del más viejo al más nuevo) y limpio (sin mensajes de bienvenida de UI).
 */
export async function obtenerRespuestaIA(
  mensajeUsuario: string,
  historial: Mensaje[],
): Promise<string> {
  try {
    const historialGemini = historial.map((msg) => ({
      role: msg.emisor === "usuario" ? "user" : "model",
      parts: [{ text: msg.texto }],
    }));

    const chat = getModel().startChat({ history: historialGemini });
    const result = await chat.sendMessage(mensajeUsuario);
    return result.response.text();
  } catch (error) {
    console.error("Error al conectar con Gemini:", error);
    return "Lo siento, tuve un problema de conexión. ¿Podrías intentar de nuevo?";
  }
}

/**
 * Análisis visual con Gemini Vision. Recibe la imagen en base64 (sin prefijo data:).
 */
export async function analizarImagenIA(
  base64Image: string,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg",
): Promise<string> {
  try {
    const prompt =
      "Eres el validador experto del sistema Ahorr-E. Mira esta imagen. " +
      "Identifica el producto que aparece. Luego, basándote en tu conocimiento " +
      "de precios de mercado en supermercados chilenos, estima un precio aproximado " +
      "en pesos chilenos (CLP). Sé conciso. Si no puedes identificar el producto " +
      "con certeza, dilo explícitamente — no inventes datos.";

    const imagePart = {
      inlineData: { data: base64Image, mimeType },
    };

    const result = await getModel().generateContent([prompt, imagePart]);
    return result.response.text();
  } catch (error) {
    console.error("Error en Gemini Vision:", error);
    return "Error al conectar con el cerebro visual de Gemini.";
  }
}

/**
 * RF3 + RF6 — Recomendación de ahorro con grounding estricto.
 * La IA SOLO razona sobre el payload recibido (productos del scraper + presupuesto).
 * Esto mitiga alucinaciones y cumple el requerimiento del informe técnico.
 */
export async function recomendarAhorro(payload: PayloadGrounding): Promise<string> {
  try {
    const prompt = [
      "Eres el motor de recomendaciones de Ahorr-E.",
      "REGLA CRÍTICA: solo puedes hablar sobre los productos listados a continuación.",
      "No inventes productos, precios ni tiendas que no aparezcan en la lista.",
      "Si la lista está vacía, responde literalmente: \"No tengo datos para recomendar.\"",
      "",
      "Datos disponibles (JSON):",
      JSON.stringify(payload, null, 2),
      "",
      "Tarea: en máximo 3 oraciones, recomienda al usuario qué producto de la lista",
      "le conviene comprar y por qué, considerando el ahorro vs precio original",
      payload.presupuestoDisponible !== undefined
        ? "y respetando su presupuesto disponible."
        : "(sin información de presupuesto).",
      "Responde en español chileno, tono cercano pero claro.",
    ].join("\n");

    const result = await getModel().generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generando recomendación de ahorro:", error);
    return "No pude generar una recomendación en este momento.";
  }
}
