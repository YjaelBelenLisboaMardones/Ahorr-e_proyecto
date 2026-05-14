export function getAuthToken(authHeader: string | null): string {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header.");
  }
  return authHeader.slice(7);
}
