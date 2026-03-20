import { NextRequest, NextResponse } from "next/server";

// Roblox endpoint to check if a cookie is valid
// Returns 200 + user info if alive, 401 if dead
const ROBLOX_API = "https://users.roblox.com/v1/users/authenticated";

// How many cookies to check concurrently per batch
const BATCH_SIZE = 5;
// Delay between batches in ms
const BATCH_DELAY = 1000;

interface CookieResult {
  cookie: string;
  username: string;
  alive: boolean;
  robloxUsername?: string;
  userId?: number;
  error?: string;
}

async function checkCookie(cookie: string, username: string): Promise<CookieResult> {
  try {
    // Strip any whitespace
    const cleanCookie = cookie.trim();

    const res = await fetch(ROBLOX_API, {
      method: "GET",
      headers: {
        Cookie: `.ROBLOSECURITY=${cleanCookie}`,
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (res.status === 200) {
      const data = await res.json();
      return {
        cookie,
        username,
        alive: true,
        robloxUsername: data.name,
        userId: data.id,
      };
    }

    // 401 = unauthorized (dead cookie), 403 = forbidden
    return {
      cookie,
      username,
      alive: false,
      error: `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      cookie,
      username,
      alive: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accounts } = body as {
      accounts: { username: string; cookie: string }[];
    };

    if (!Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json({ error: "No accounts provided" }, { status: 400 });
    }

    const results: CookieResult[] = [];

    // Process in batches
    for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
      const batch = accounts.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(({ username, cookie }) => checkCookie(cookie, username))
      );

      results.push(...batchResults);

      // Delay between batches (skip delay after last batch)
      if (i + BATCH_SIZE < accounts.length) {
        await sleep(BATCH_DELAY);
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}