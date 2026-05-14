import type { NextRequest } from "next/server";
import { supabaseAdminClient } from "../lib/supabase";
import { UnauthorizedError } from "../errors/unauthorized-error";
import type { AuthUser } from "../types/auth-user";

export type AuthContext = AuthUser;

function extractToken(authHeader: string | null): string {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header.");
  }
  return authHeader.slice(7);
}

export const getAuthContext = async (request: NextRequest): Promise<AuthContext> => {
  const token = extractToken(request.headers.get("authorization"));
  const {
    data: { user },
    error,
  } = await supabaseAdminClient.auth.getUser(token);
  if (error || !user) throw new UnauthorizedError("Invalid or expired token.", error?.message);
  return {
    userId: user.id,
    email: user.email,
    role: user.user_metadata["role"] as string | undefined,
  };
};

export const requireAuth = getAuthContext;
