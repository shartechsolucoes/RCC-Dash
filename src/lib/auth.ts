const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
const TOKEN_KEY = "fraternidade_access_token";

export interface CurrentUser {
  id: string;
  email: string;
  profileLevel: string;
  member: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    birthDate: string | null;
  } | null;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Credenciais inválidas");
  }

  const data = await response.json();
  saveToken(data.accessToken);
}

export async function fetchMe(): Promise<CurrentUser | null> {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    clearToken();
    return null;
  }

  return response.json();
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login";
  }

  return response;
}
