/**
 * Modelo de mensaje del chat con la IA.
 * Mantiene compatibilidad con la convención usada por el equipo en el proyecto Expo.
 */
export interface Mensaje {
  id: string;
  emisor: "usuario" | "ia";
  texto: string;
}
