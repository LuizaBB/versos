const raw = import.meta.env.VITE_API_URL;
/** Base da API: dev = Uvicorn local; prod na Vercel (2 serviços) = prefixo do backend. */
const API =
  typeof raw === "string" && raw.trim().length > 0
    ? raw.trim().replace(/\/$/, "")
    : import.meta.env.DEV
      ? "http://127.0.0.1:8080"
      : "/_/backend";

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
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = data?.detail;
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
