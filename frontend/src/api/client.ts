const raw = import.meta.env.VITE_API_URL;
/** Base da API: dev = Uvicorn local; prod na Vercel (vercel_app) = /api (montagem FastAPI). */
const API =
  typeof raw === "string" && raw.trim().length > 0
    ? raw.trim().replace(/\/$/, "")
    : import.meta.env.DEV
      ? "http://127.0.0.1:8080"
      : "/api";

const TOKEN_KEY = "versos_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  auth = true
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const t = getToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }
  const url = API ? `${API}${path}` : path;
  const res = await fetch(url, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      const preview = text.slice(0, 200).replace(/\s+/g, " ");
      throw new Error(
        `Resposta não-JSON (${res.status} ${url}). Isto costuma ser HTML da CDN ou 404 — confirma que a API está em /api. Início: ${preview}`
      );
    }
  }
  if (!res.ok) {
    const body = data as { detail?: unknown } | null;
    const detail = body?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).join(", ")
          : res.statusText;
    throw new Error(msg || "Erro na requisição");
  }
  return data as T;
}

export { API };
