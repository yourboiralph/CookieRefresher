import { NextRequest, NextResponse } from "next/server";

const LOGIN_URL = "https://auth.roblox.com/v2/login";

interface RefreshResult {
  username: string;
  success: boolean;
  newCookie?: string;
  newFull?: string; // full user:pass:_|WARNING...|_cookie line
  error?: string;
}

async function refreshAccount(
  username: string,
  password: string
): Promise<RefreshResult> {
  try {
    // Step 1 — First request gets a 403 with X-CSRF-TOKEN in the response header
    const firstRes = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ ctype: "Username", cvalue: username, password }),
    });

    const csrfToken = firstRes.headers.get("x-csrf-token");

    if (!csrfToken) {
      // Sometimes the first request succeeds directly (no CSRF needed)
      if (firstRes.status === 200) {
        const cookie = extractCookieFromResponse(firstRes);
        if (cookie) {
          return {
            username,
            success: true,
            newCookie: cookie,
            newFull: buildFullLine(username, password, cookie),
          };
        }
      }

      const body = await firstRes.json().catch(() => ({}));
      return {
        username,
        success: false,
        error: getErrorMessage(firstRes.status, body),
      };
    }

    // Step 2 — Retry with CSRF token
    const secondRes = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "X-CSRF-TOKEN": csrfToken,
      },
      body: JSON.stringify({ ctype: "Username", cvalue: username, password }),
    });

    if (secondRes.status === 200) {
      const cookie = extractCookieFromResponse(secondRes);
      if (cookie) {
        return {
          username,
          success: true,
          newCookie: cookie,
          newFull: buildFullLine(username, password, cookie),
        };
      }
      return { username, success: false, error: "Login succeeded but no cookie returned" };
    }

    const body = await secondRes.json().catch(() => ({}));
    return {
      username,
      success: false,
      error: getErrorMessage(secondRes.status, body),
    };
  } catch (err) {
    return {
      username,
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

function extractCookieFromResponse(res: Response): string | null {
  // The .ROBLOSECURITY cookie is in the Set-Cookie header
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/\.ROBLOSECURITY=([^;]+)/);
  return match ? match[1] : null;
}

function buildFullLine(username: string, password: string, rawCookie: string): string {
  const warning = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_";
  return `${username}:${password}:${warning}${rawCookie}`;
}

function getErrorMessage(status: number, body: any): string {
  // Roblox error codes
  const code = body?.errors?.[0]?.code;
  const messages: Record<number, string> = {
    0:   "Unknown error",
    1:   "Invalid username or password",
    2:   "Account not found",
    3:   "Account locked",
    4:   "Account banned",
    5:   "Too many attempts — rate limited",
    6:   "Account requires 2FA",
    10:  "Suspicious login — captcha required",
    12:  "Password reset required",
  };
  if (code !== undefined && messages[code]) return messages[code];
  return `HTTP ${status}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accounts } = body as {
      accounts: { username: string; password: string }[];
    };

    if (!Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json({ error: "No accounts provided" }, { status: 400 });
    }

    // Process one at a time to avoid triggering rate limits
    const results: RefreshResult[] = [];
    for (const { username, password } of accounts) {
      const result = await refreshAccount(username, password);
      results.push(result);
    }

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}