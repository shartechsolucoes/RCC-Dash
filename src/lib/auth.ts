const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
const TOKEN_KEY = "fraternidade_access_token";

/**
 * Base da API resolvida em tempo de execução.
 *
 * O valor configurado aponta para localhost, o que só vale quando a página é
 * aberta na própria máquina. Acessada de outro aparelho da rede (celular, outro
 * PC), "localhost" passa a ser o aparelho do visitante e nenhuma chamada
 * funciona. Nesse caso reaproveitamos o host pelo qual a página foi servida,
 * mantendo a porta da API — assim vale tanto em localhost quanto na rede, sem
 * depender de fixar um IP que o DHCP troca.
 */
function apiUrl() {
  if (typeof window === "undefined") return CONFIGURED_API_URL;

  try {
    const configured = new URL(CONFIGURED_API_URL);
    const isLoopback = configured.hostname === "localhost" || configured.hostname === "127.0.0.1";

    if (isLoopback && window.location.hostname !== configured.hostname) {
      configured.hostname = window.location.hostname;
      return configured.origin;
    }
  } catch {
    // NEXT_PUBLIC_API_URL malformada: usa o valor como veio.
  }

  return CONFIGURED_API_URL;
}

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
    createdAt: string;
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
  cachedProfileLevel = null;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Populado pelo fetchMe() mais recente. Permite ao apiFetch barrar escritas de
// MEMBRO sem esperar uma nova chamada de rede a cada clique — é uma rede de
// segurança de UI para telas que esqueçam de esconder o próprio controle de
// edição; a garantia de verdade continua sendo o backend.
let cachedProfileLevel: string | null = null;

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${apiUrl()}/auth/login`, {
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

  const response = await fetch(`${apiUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    clearToken();
    return null;
  }

  const user: CurrentUser = await response.json();
  cachedProfileLevel = user.profileLevel;
  return user;
}

// Escritas que um MEMBRO pode fazer (auto-serviço). A garantia real é o backend;
// isto só libera o atalho de UI que barra escritas de MEMBRO.
const MEMBER_WRITABLE: RegExp[] = [
  /^\/auth\/change-password$/,
];

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();

  const memberAllowed = MEMBER_WRITABLE.some((re) => re.test(path.split("?")[0]));
  if (cachedProfileLevel === "MEMBRO" && MUTATING_METHODS.has(method) && !memberAllowed) {
    return new Response(JSON.stringify({ message: "Seu perfil tem acesso apenas de leitura." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = getToken();
  const response = await fetch(`${apiUrl()}${path}`, {
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
