export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://truehive-erp.1ag4bevrwgjd8.ap-southeast-2.cs.amazonlightsail.com/api/v1";

/**
 * Standard API client for Decoupled Frontend-Backend communication.
 * - Automatically injects Bearer token from client session.
 * - Automatically handles 401 Unauthorized by clearing session and redirecting to /login.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("truehive_token")
      : null;

  const authHeaders: Record<string, string> = {};
  if (token && !(options.headers as any)?.["Authorization"]) {
    authHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("truehive_token");
      localStorage.removeItem("truehive_user");
      document.cookie = "truehive_token=; path=/; max-age=0";
      document.cookie = "truehive_auth_token=; path=/; max-age=0";
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `API error: ${res.statusText}`);
  }

  return res.json();
}
