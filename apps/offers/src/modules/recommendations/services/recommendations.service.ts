import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireEnv } from "@ahorre/shared";
import type { ScrapedOffer } from "../../offers/services/scraper.service";

export type RecommendationInput = {
  query: string;
  offers: ScrapedOffer[];
  userContext?: string;
};

export async function generateRecommendations(input: RecommendationInput): Promise<string> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const offersText = input.offers
    .map(
      (o, i) =>
        `${i + 1}. ${o.name} — $${o.price.toLocaleString("es-CL")}${o.discountPct ? ` (${o.discountPct}% descuento)` : ""}`
    )
    .join("\n");

  // RF3: grounding obligatorio — Gemini solo usa el payload del scraper, no conocimiento libre
  const prompt = `Eres un asistente de ahorro personal. \
Tu objetivo es ayudar a ahorrar dinero eligiendo las mejores ofertas.

El usuario busca: "${input.query}".
${input.userContext ? `Contexto adicional del usuario: ${input.userContext}` : ""}

Ofertas actuales en MercadoLibre Chile:
${offersText.length > 0 ? offersText : "(No se encontraron ofertas en este momento.)"}

Basándote EXCLUSIVAMENTE en las ofertas anteriores, recomienda las mejores opciones considerando:
1. Mayor descuento porcentual
2. Mejor relación precio-calidad aparente
3. Marca/características mencionadas en el nombre

Sé conciso, directo y usa máximo 3 recomendaciones. No inventes productos que no están en la lista.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("[Gemini] error:", err);
    throw err;
  }
}
