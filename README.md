# Account Manager Hub

A Next.js web app for managing [Roblox Account Manager](https://github.com/ic3w0lf22/Roblox-Account-Manager) exports. Split accounts, look up dead cookies, and replace refreshed cookies — all in one place.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Installation

```bash
# 1. Clone or download the project
cd account-hub

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

---

## Features

### ⚡ Split Accounts
Splits your full account list into two separate files:
- `userpasscombo.txt` — one `username:password` per line
- `cookiecombo.txt` — one cookie per line

Supports an optional **original order reference** — paste your original account list and the output will be sorted to match it, even if your checker returned accounts in a different order.

### 🔍 Dead Cookie Lookup
Takes a list of dead cookies and finds the matching `username:password` combos from your account list.

Accepts dead cookies in **both formats**:
- Cookie only: `_|WARNING:...|_CAEaAh...`
- Full line: `username:password:_|WARNING:...|_CAEaAh...`

Outputs `dead_userpass.txt` — ready to paste into Account Manager to refresh.

### 🔄 Replace Cookies
Takes your refreshed accounts (new `user:pass:cookie` lines) and replaces the matching entries in your main account list. **Original order is always preserved.**

---

## File Format

All files use the standard Roblox Account Manager export format:

```
username:password:_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEaAh...
```

The `_|WARNING` string is used as the delimiter to reliably split username:password from the cookie — even if the password contains colons.

---

## Project Structure

```
account-hub/
├── app/
│   ├── page.tsx                  # Main page — tab navigation
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles + Tailwind base
│   ├── lib/
│   │   └── parser.ts             # All parsing logic (pure TypeScript)
│   └── components/
│       ├── ui.tsx                # Shared UI primitives
│       ├── SplitPanel.tsx        # Split tab
│       ├── LookupPanel.tsx       # Lookup tab
│       └── ReplacePanel.tsx      # Replace tab
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

### Key File: `app/lib/parser.ts`

All account processing logic lives here as pure functions with no UI dependencies. This makes it easy to test, extend, or reuse:

| Function | Description |
|---|---|
| `parseAccounts(text)` | Parses raw account text into a dictionary keyed by username |
| `extractCookie(line)` | Extracts the cookie from a full or cookie-only line |
| `splitAccounts(text, orderText?)` | Splits accounts into userpass + cookie lists |
| `lookupDeadCookies(accounts, dead)` | Matches dead cookies to user:pass combos |
| `replaceCookies(accounts, refreshed)` | Replaces matching entries, preserves order |

---

## Dependencies

| Package | Purpose |
|---|---|
| `next` | Framework |
| `react` / `react-dom` | UI |
| `tailwindcss` | Styling |
| `clsx` | Conditional class names |
| `lucide-react` | Icons |

---

## Security Notes

- All processing happens **entirely in the browser** — no data is ever sent to a server.
- Nothing is logged or stored externally.
- The app has no backend, no API routes, and no network requests.

---

## Tips

- **Dead lookup not matching?** Make sure your `account.txt` is the latest export from Account Manager — cookies rotate after a refresh.
- **Order not matching?** Paste your original account list into the "Original Order Reference" field in the Split tab.
- **Checker output format** — the Dead Lookup tab accepts the full `user:pass:cookie` line, so you can paste checker output directly without stripping it first.