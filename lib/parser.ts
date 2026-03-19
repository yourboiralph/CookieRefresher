export const DELIMITER = "_|WARNING";

export interface Account {
  username: string;
  userpass: string;
  cookie: string;
  full: string;
}

export interface ParseResult {
  accounts: Record<string, Account>;
  order: string[];
}

export function parseAccounts(text: string): ParseResult {
  const accounts: Record<string, Account> = {};
  const order: string[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || !line.includes(DELIMITER)) continue;

    const idx = line.indexOf(DELIMITER);
    const left = line.slice(0, idx).replace(/:$/, "");
    const right = line.slice(idx + DELIMITER.length);

    const username = left.split(":")[0];
    if (!username) continue;

    accounts[username] = {
      username,
      userpass: left,
      cookie: DELIMITER + right,
      full: line,
    };
    order.push(username);
  }

  return { accounts, order };
}

export function extractCookie(line: string): string {
  if (line.includes(DELIMITER)) {
    const idx = line.indexOf(DELIMITER);
    return DELIMITER + line.slice(idx + DELIMITER.length);
  }
  return line.trim();
}

export function buildCookieMap(parsed: ParseResult): Record<string, string> {
  const map: Record<string, string> = {};
  for (const u of Object.keys(parsed.accounts)) {
    map[parsed.accounts[u].cookie] = parsed.accounts[u].userpass;
  }
  return map;
}

// ── Split ──────────────────────────────────────────────────────────────────
export interface SplitResult {
  userpassLines: string;
  cookieLines: string;
  count: number;
  warnings: string[];
}

export function splitAccounts(
  accountsText: string,
  orderText?: string
): SplitResult {
  const { accounts, order } = parseAccounts(accountsText);
  const warnings: string[] = [];
  let sorted = [...order];

  if (orderText?.trim()) {
    const refOrder = orderText
      .split("\n")
      .map((l) => l.trim().split(":")[0])
      .filter(Boolean);

    const inRef = refOrder.filter((u) => accounts[u]);
    const notInRef = order.filter((u) => !refOrder.includes(u));

    refOrder
      .filter((u) => !accounts[u])
      .forEach((u) => warnings.push(`'${u}' in order file but not found`));
    notInRef.forEach((u) =>
      warnings.push(`'${u}' not in order file — appended at end`)
    );

    sorted = [...inRef, ...notInRef];
  }

  return {
    userpassLines: sorted.map((u) => accounts[u].userpass).join("\n"),
    cookieLines: sorted.map((u) => accounts[u].cookie).join("\n"),
    count: sorted.length,
    warnings,
  };
}

// ── Lookup ─────────────────────────────────────────────────────────────────
export interface LookupResult {
  found: string[];
  notFound: number;
  total: number;
}

export function lookupDeadCookies(
  accountsText: string,
  deadText: string
): LookupResult {
  const parsed = parseAccounts(accountsText);
  const cookieMap = buildCookieMap(parsed);

  const deadLines = deadText.split("\n").map((l) => l.trim()).filter(Boolean);
  const found: string[] = [];
  let notFound = 0;

  for (const line of deadLines) {
    const cookie = extractCookie(line);
    if (cookieMap[cookie]) {
      found.push(cookieMap[cookie]);
    } else {
      notFound++;
    }
  }

  return { found, notFound, total: deadLines.length };
}

// ── Replace ────────────────────────────────────────────────────────────────
export interface ReplaceResult {
  output: string;
  replaced: number;
  unmatched: string[];
  total: number;
}

export function replaceCookies(
  accountsText: string,
  refreshedText: string
): ReplaceResult {
  const { accounts, order } = parseAccounts(accountsText);
  const { accounts: refreshed } = parseAccounts(refreshedText);

  let replaced = 0;
  for (const u of order) {
    if (refreshed[u]) {
      accounts[u] = refreshed[u];
      replaced++;
    }
  }

  const unmatched = Object.keys(refreshed).filter((u) => !accounts[u]);

  return {
    output: order.map((u) => accounts[u].full).join("\n"),
    replaced,
    unmatched,
    total: order.length,
  };
}
