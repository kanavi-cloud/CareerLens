import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

export type AuthUser = {
  user_id: number;
  login_id: string;
  display_name: string;
  email: string;
  role?: string;
  admin?: boolean;
  profile_completed: boolean;
  account_status?: string;
  email_verified?: boolean;
  last_login_at?: string | null;
  access_token?: string;
  token_type?: string;
  expires_at?: number;
  country_dial_code?: string | null;
  phone_number?: string | null;
  marketing_opt_in?: boolean;
};

export type AvailabilityResponse = {
  field: "login_id" | "email";
  value: string;
  available: boolean;
  message: string;
};

const STORAGE_KEY = "careerlens_user";

// Native 앱 내 즉시 접근을 위한 메모리 캐시 변수
let memoryUserCache: AuthUser | null = null;

/**
 * 앱 구동 시 초기 메모리 캐시 동기화용 (AsyncStorage 비동기 읽기)
 */
export async function loadStoredUserAsync(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryUserCache = JSON.parse(raw) as AuthUser;
    } else {
      memoryUserCache = null;
    }
  } catch (e) {
    console.error("[Auth] Failed to load user from storage:", e);
    memoryUserCache = null;
  }
  return memoryUserCache;
}

/**
 * 동기적 유저 조회 (기존 컴포넌트 호환용)
 */
export function getStoredUser(): AuthUser | null {
  return memoryUserCache;
}

/**
 * 유저 정보 저장 (AsyncStorage + 메모리 캐시)
 */
export async function storeUser(user: AuthUser): Promise<void> {
  memoryUserCache = user;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("[Auth] Failed to save user to storage:", e);
  }
}

/**
 * 유저 정보 삭제 (로그아웃 등)
 */
export async function clearStoredUser(): Promise<void> {
  memoryUserCache = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("[Auth] Failed to clear user from storage:", e);
  }
}

export function isAdminUser(user: AuthUser | null) {
  return Boolean(user?.admin) || user?.role === "ADMIN";
}

export function authHeaders(): Record<string, string> {
  const user = getStoredUser();
  if (!user?.access_token) {
    return {};
  }
  return {
    Authorization: `${user.token_type ?? "Bearer"} ${user.access_token}`,
  };
}

export function getApiBaseUrl(): string {
  const envFromProcess =
    process.env.EXPO_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

  const envFromExpoExtra =
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.[
      "EXPO_PUBLIC_API_BASE_URL"
    ] as string | undefined;

  const candidates = [envFromProcess, envFromExpoExtra].filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0
  );

  return candidates[0] ?? "http://localhost:8080";
}

function getBaseUrl(): string {
  return getApiBaseUrl();
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  context: string
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    const baseUrl = getBaseUrl();
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error && error.stack ? `\n${error.stack.split("\n").slice(0, 3).join("\n")}` : "";

    let extraHint = "";
    const lowerMsg = errorMessage.toLowerCase();
    if (lowerMsg.includes("failed to fetch") || lowerMsg.includes("networkerror") || lowerMsg.includes("cors")) {
      extraHint =
        "\n\n💡 예상 원인: 브라우저 CORS / 네트워크 오류\n" +
        "  1. 백엔드 서버가 " + baseUrl + " 에서 정말 실행 중인지 브라우저 주소창에서 직접 열어보세요.\n" +
        "  2. (Expo Tunnel 사용시) 터널 대신 웹 기본 주소인 http://localhost:8081 로 접속 중인지 확인해주세요.\n" +
        "  3. Docker Desktop / 백엔드 컨테이너가 켜져 있는지 docker ps 로 확인해주세요.";
    } else if (lowerMsg.includes("load failed") || lowerMsg.includes("not found") || lowerMsg.includes("enotfound")) {
      extraHint =
        "\n\n💡 예상 원인: 호스트를 찾을 수 없습니다\n" +
        "  EXPO_PUBLIC_API_BASE_URL 이 올바른 호스트인지 확인해주세요. (Docker: localhost:8088 / 직접실행: localhost:8080)";
    } else if (lowerMsg.includes("timeout") || lowerMsg.includes("timed out")) {
      extraHint = "\n\n💡 예상 원인: 서버 응답 시간 초과 - 백엔드가 아직 초기화 중일 수 있으니 잠시 후 다시 시도하세요.";
    }

    throw new Error(
      `[${context}] 서버 요청 실패 (${errorName})\n` +
      `요청 주소: ${String(input)}\n` +
      `API Base: ${baseUrl}\n` +
      `원인: ${errorMessage}` +
      extraHint +
      errorStack,
      { cause: error }
    );
  }
}

export async function signup(input: {
  login_id: string;
  display_name: string;
  email: string;
  country_dial_code?: string;
  phone_number?: string;
  password: string;
  password_confirm: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  security_notice_accepted: boolean;
  marketing_opt_in: boolean;
}): Promise<AuthUser> {
  const user = await authRequest("/api/auth/signup", input);
  await storeUser(user);
  return user;
}

export async function login(input: {
  login_id: string;
  password: string;
}): Promise<AuthUser> {
  const user = await authRequest("/api/auth/login", input);
  await storeUser(user);
  return user;
}

export async function logout(): Promise<void> {
  const baseUrl = getBaseUrl();
  try {
    await apiFetch(
      `${baseUrl}/api/auth/logout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      },
      "로그아웃"
    );
  } catch (error) {
    console.warn("[Auth] Server logout failed, clearing local session anyway:", error);
  } finally {
    await clearStoredUser();
  }
}

export async function checkLoginIdAvailability(
  loginId: string
): Promise<AvailabilityResponse> {
  return availabilityRequest(
    `/api/auth/check-login-id?login_id=${encodeURIComponent(loginId)}`
  );
}

export async function checkEmailAvailability(
  email: string
): Promise<AvailabilityResponse> {
  return availabilityRequest(
    `/api/auth/check-email?email=${encodeURIComponent(email)}`
  );
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const baseUrl = getBaseUrl();
  const response = await apiFetch(
    `${baseUrl}/api/auth/me`,
    {
      headers: authHeaders(),
    },
    "현재 사용자 조회"
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Current user request failed.")
    );
  }

  const user = await response.json();
  await storeUser(user);
  return user;
}

export async function updateCurrentUser(input: {
  display_name: string;
  email: string;
  country_dial_code?: string;
  phone_number?: string;
  marketing_opt_in?: boolean;
}): Promise<AuthUser> {
  const baseUrl = getBaseUrl();
  const response = await apiFetch(
    `${baseUrl}/api/auth/me`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(input),
    },
    "계정 정보 수정"
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Account update request failed.")
    );
  }

  const user = await response.json();
  await storeUser(user);
  return user;
}

export async function changePassword(input: {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}): Promise<AuthUser> {
  const baseUrl = getBaseUrl();
  const response = await apiFetch(
    `${baseUrl}/api/auth/me/password`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(input),
    },
    "비밀번호 변경"
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Password change request failed.")
    );
  }

  const user = await response.json();
  await storeUser(user);
  return user;
}

async function authRequest(path: string, input: object): Promise<AuthUser> {
  const baseUrl = getBaseUrl();
  const response = await apiFetch(
    `${baseUrl}${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    "인증 요청"
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Authentication request failed.")
    );
  }

  return response.json();
}

async function availabilityRequest(
  path: string
): Promise<AvailabilityResponse> {
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${path}`;
  let response: Response;
  try {
    response = await apiFetch(
      fullUrl,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
      "중복 확인"
    );
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("중복 확인 요청 중 네트워크 오류가 발생했습니다.", { cause: error });
  }

  if (!response.ok) {
    const bodyText = await response.text();
    let serverMessage: string | undefined;
    try {
      const parsed = JSON.parse(bodyText || "{}") as { message?: string; error?: string; path?: string };
      serverMessage = parsed.message || parsed.error;
    } catch {
      serverMessage = bodyText.slice(0, 200);
    }

    const details = [
      `HTTP ${response.status} ${response.statusText}`,
      `URL: ${fullUrl}`,
    ];
    if (serverMessage) details.push(`서버 메시지: ${serverMessage}`);
    details.push(
      "확인: 백엔드 서버가 " + baseUrl + " 에서 정상 실행 중인지, docker ps 로 컨테이너 상태를 확인해주세요."
    );
    throw new Error(`[중복 확인] 서버 응답 오류\n${details.join("\n")}`);
  }

  try {
    return (await response.json()) as AvailabilityResponse;
  } catch (error) {
    const textPreview = (await response.text()).slice(0, 200);
    throw new Error(
      `[중복 확인] 서버 응답을 JSON 으로 파싱할 수 없습니다.\n` +
      `URL: ${fullUrl}\n` +
      `응답 미리보기: ${textPreview || "(비어있음)"}`,
      { cause: error }
    );
  }
}

export async function readApiError(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) {
    return `HTTP ${response.status} ${response.statusText} — ${fallback}`;
  }
  try {
    const parsed = JSON.parse(text) as {
      message?: string;
      error?: string;
      details?: Array<string> | string;
      path?: string;
    };
    const parts: string[] = [];
    if (response.status >= 400) {
      parts.push(`HTTP ${response.status} ${response.statusText}`);
    }
    if (parsed.message) parts.push(parsed.message);
    if (parsed.error && parsed.error !== parsed.message) parts.push(parsed.error);
    if (parsed.details && String(parsed.details).trim()) parts.push(String(parsed.details));
    if (parts.length === 0) return text;
    return parts.join(" / ");
  } catch {
    return `HTTP ${response.status} ${response.statusText} — ${text.slice(0, 300)}`;
  }
}
