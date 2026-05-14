type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const APP_NAMES = ["auth", "finance", "offers"] as const;
type AppName = (typeof APP_NAMES)[number];

const PUBLIC_BASE_URLS: Record<AppName, string> = {
  auth: process.env["NEXT_PUBLIC_AUTH_API_URL"] ?? "https://ahorre-auth.vercel.app",
  finance: process.env["NEXT_PUBLIC_FINANCE_API_URL"] ?? "https://ahorre-finance.vercel.app",
  offers: process.env["NEXT_PUBLIC_OFFERS_API_URL"] ?? "https://ahorre-offers.vercel.app",
};

function getBaseUrl(app: AppName): string {
  const url = PUBLIC_BASE_URLS[app];
  if (typeof window === "undefined") return url;
  if (url.includes("localhost") && !window.location.hostname.includes("localhost")) {
    return PUBLIC_BASE_URLS[app];
  }
  return url;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errorCode?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(
  app: AppName,
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, headers = {} } = options;

  const url = `${getBaseUrl(app)}/api/v1${path}`;

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };
  if (token) reqHeaders["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const message = (data["message"] as string | undefined) ?? `HTTP ${response.status}`;
    const errorCode = data["errorCode"] as string | undefined;
    throw new ApiError(response.status, message, errorCode);
  }

  const data = (await response.json()) as { data: T };
  return data.data;
}
