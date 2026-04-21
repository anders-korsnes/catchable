# Pokémon Tinder

> **One-line pitch:** A Tinder-style web app where users swipe on Pokémon, each paired with a random human name and a Chuck Norris joke matched to their type.

---

## 🎯 Overview

**Project Type:** Full-stack web app (frontend + lightweight backend / API layer)
**Status:** Planning

### Description
A playful web app that presents Pokémon one at a time in a swipe-style interface. Each Pokémon gets a randomized human name (e.g. "Josh the Charmander"), basic stats, and a Chuck Norris joke themed to its type. Users create an account, filter by region and type, like or dislike Pokémon, and revisit their liked ones in a dedicated view. Disliked Pokémon never reappear.

### Goals
- Deliver every functional requirement in the brief — this is the single most important success criterion
- Ship code that reads like production code: typed, structured, tested where it counts, and easy for someone else to run
- Anyone on any major OS should be able to clone the repo and launch the app by following the README
- Keep the experience fun — the swipe interaction should feel snappy and satisfying

### Out of Scope
- Real matchmaking, chat, or social features (it's "Tinder for Pokémon," not a dating platform)
- Password recovery, email verification, OAuth (username + password only, per brief)
- Payment, premium tiers, ads
- Native mobile apps (responsive web only)
- Internationalization / multi-language support
- Admin dashboard or content moderation tools

---

## ✨ Features

### Must-Have

1. **Account creation & authentication**
   - What it does: Users register with username + password and log in to access the app.
   - Acceptance criteria:
     - [ ] Registration form validates username uniqueness and password strength
     - [ ] Passwords are hashed (never stored in plain text)
     - [ ] Login persists across page reloads (session or JWT)
     - [ ] Logout clears the session
     - [ ] Protected routes redirect unauthenticated users to login

2. **Preference setup — region & types**
   - What it does: User selects one Pokémon region and one or more types to filter the swipe deck.
   - Acceptance criteria:
     - [ ] Region list pulled from PokéAPI (`/region`)
     - [ ] Type list pulled from PokéAPI (`/type`)
     - [ ] User can update preferences at any time from a settings view
     - [ ] Preferences are saved per user and survive logout/login

3. **Swipe deck (core experience)**
   - What it does: Shows one Pokémon at a time as a card the user can like or dislike.
   - Acceptance criteria:
     - [ ] Card displays: random human name + Pokémon name (e.g. "Josh the Charmander")
     - [ ] Card displays: official artwork or sprite from PokéAPI
     - [ ] Card displays: type, weight, height, base experience (as proxy for "lvl"), and one ability/skill
     - [ ] Card displays: a Chuck Norris joke matched to the Pokémon's type when possible, falling back to a random joke if no type-matched joke exists
     - [ ] Like and Dislike buttons are clearly visible (swipe gestures optional)
     - [ ] After a decision, the next Pokémon loads without a noticeable delay
     - [ ] Disliked Pokémon never reappear for that user
     - [ ] Already-liked Pokémon don't reappear in the deck either
     - [ ] Empty state shown when no more Pokémon match the user's filters

4. **Liked Pokémon view**
   - What it does: A dedicated page listing all Pokémon the user has liked.
   - Acceptance criteria:
     - [ ] Lists every liked Pokémon with image, name, and key info
     - [ ] User can remove a Pokémon from their liked list
     - [ ] Empty state shown if the user hasn't liked anything yet

5. **Persistence of user choices**
   - What it does: Likes, dislikes, and preferences persist between sessions.
   - Acceptance criteria:
     - [ ] All choices stored server-side, tied to the user account
     - [ ] State survives logout, browser close, and device switch

### Nice-to-Have
- Swipe gestures (drag the card left/right) in addition to buttons
- Subtle animation when a card exits
- "Undo last action" button (one-step)
- Keyboard shortcuts (← dislike, → like)
- Counter showing how many Pokémon the user has liked

---

## 🎨 Design & Style

### Visual Direction
**Modern minimal foundation, classic Pokémon DNA layered on top.** The base layout is clean and contemporary — generous whitespace, smooth corners, refined typography. On top of that we lean into Game Boy and Gen 1 Pokédex elements as accents: a pixel-font for headings, a subtle "screen" frame around the swipe card that nods to the Game Boy LCD, type badges using the classic Pokémon color system, and a Pokédex-inspired aesthetic for the Liked view. The result should feel like a Pokédex device reimagined as a modern app — not a retro pastiche, not a generic SaaS clone.

### Core Aesthetic Rules
- The chrome is modern; the personality is retro. Buttons, inputs, layout grid → modern. Headings, type badges, card frame, sound-effect-style microcopy → retro.
- Pixel art and pixel fonts are accents, never the whole interface. Body copy stays in a clean sans-serif so jokes are readable.
- The swipe card is framed like a Game Boy screen: a soft outer "device" border with a slightly inset "screen" area where the Pokémon lives.
- Use the dot-matrix / scanline texture sparingly — only on the card screen area, never full-page.

### Color Palette
Two complementary palettes: **Modern UI colors** for chrome (backgrounds, text, borders, buttons) and **Retro accent colors** for personality (the Game Boy nods).

**Modern UI**
- **Background:** `#F5F5F4` (warm off-white) / `#0C0A09` (dark mode)
- **Surface / Card:** `#FFFFFF` / `#1C1917`
- **Text primary:** `#1C1917` / `#F5F5F4`
- **Text muted:** `#78716C`
- **Border:** `#E7E5E4` / `#292524`

**Retro accents**
- **Pokédex Red:** `#DC2626` — primary brand color, app header, Liked tab, logo (the iconic Pokédex shell)
- **Game Boy Screen Green:** `#9BBC0F` (lightest) → `#306230` (darkest) — used for the card's inset "screen" background and the dot-matrix texture; only 4 shades total to honor the original 4-color GB palette
- **Action Blue:** `#3B82F6` — secondary accents (the Pokédex's blue light/lens)
- **Like (catch):** `#10B981` — clean modern green for the Like button (deliberately *not* the GB green so it reads as a UI affordance, not screen content)
- **Dislike (release):** `#71717A` — neutral gray rather than red; releasing a Pokémon shouldn't feel hostile, just a pass
- **Warning / Error:** `#F59E0B` / `#DC2626`

> AA contrast verified for all text combinations. The Game Boy green palette is reserved for decorative surfaces — never used for body copy.

### Typography
A two-font system: pixel for personality, sans-serif for legibility.

- **Display / Headings (pixel):** [`Press Start 2P`](https://fonts.google.com/specimen/Press+Start+2P) or [`VT323`](https://fonts.google.com/specimen/VT323) — used for the Pokémon name on the card, section titles, and stat labels. Use sparingly and at sizes where pixels read crisply (12px, 16px, 24px — never scaled).
- **Body / UI:** Inter, 400/500/600 — everything else: jokes, form fields, buttons, navigation. The joke is the comedic payoff and must be effortlessly readable.
- **Mono (numeric stats):** JetBrains Mono — for weight, height, level numbers
- **Base size:** 16px
- **Scale:** 1.25 (major third)

### Spacing & Layout
- **Base unit:** 4px (use multiples: 4, 8, 12, 16, 24, 32, 48)
- **Container width:** Max 420px on the swipe view (phone-sized for the device feel); 720px for Liked list and Settings
- **Border radius:** 20px for the card outer "device" frame, 8px for the inner screen, 8px for buttons, full for icon buttons and pills
- **Shadows:** The card uses a layered shadow that mimics a physical device sitting on a surface: `0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)`

### Card Anatomy (the hero element)
The swipe card is structured like a small handheld device:
1. **Outer shell** — rounded rectangle, `Pokédex Red` background, slight gradient/highlight on the top edge (suggests molded plastic without being skeuomorphic)
2. **Top bar** — small "lens" circle (Action Blue) and two tiny indicator dots, echoing the Pokédex's iconic red/yellow/green LEDs
3. **Inset screen** — Game Boy green background with a subtle dot-matrix texture (1px dots at low opacity), rounded corners, holds the Pokémon image
4. **Pokémon image** — official artwork, centered, rendered crisp (no blur on scale-up)
5. **Name plate** — pixel font, "Josh the Charmander" in dark text on a light strip below the screen
6. **Stat row** — type badges + weight/height/level in mono font, small and tidy
7. **Joke panel** — clean white card section below, sans-serif, this is where readability dominates

### Type Badges
Use the canonical Pokémon type colors (fire `#EE8130`, water `#6390F0`, grass `#7AC74C`, electric `#F7D02C`, etc.). Render as small pill-shaped badges with the type name in white pixel font. This is one place where the retro and modern languages meet cleanly.

### Animations & Interactions
Animations are part of the product, not decoration. Each one tells the user what just happened. All animations respect `prefers-reduced-motion` and degrade to instant state changes.

**Swipe Right / Like — "Catch" sequence (the showcase animation)**
1. Card scales up slightly (1.0 → 1.05) and tilts ~10° as it moves right
2. A Pokéball SVG drops from above to the center of the card
3. The Pokéball "opens" (top half lifts, simple two-frame animation) and emits a quick white flash
4. The Pokémon on the card dissolves into a stream of small particles that get sucked into the Pokéball
5. The Pokéball closes, wobbles 3 times (left-right-left, decreasing amplitude — classic "is it caught?" beat)
6. A small star/sparkle confirms the catch, the Pokéball flies down and to the left toward the Liked tab icon, which briefly pulses
7. Total duration: ~1.2s. Snappy, not slow.

**Swipe Left / Dislike — "Release"**
- Card tilts ~10° to the left, fades in opacity, and slides off-screen
- A subtle puff of dot-matrix pixels disperses where the card was
- Duration: ~400ms — much shorter than the catch, because the celebratory beat belongs to liking

**Card entry**
- New card slides up from below with a slight scale-in (0.95 → 1.0)
- Stack effect: a glimpse of the next card is visible behind the current one (slight offset, lower opacity), so the deck always feels alive

**Liked view entry animation**
- Caught Pokémon appear in a grid styled like Pokédex entries
- New entries (since last visit) get a brief glow / "NEW" pixel-font tag

**Micro-interactions**
- Buttons: subtle press-down (translateY 1px) + brief scale (0.97)
- Type badges on hover: gentle pulse
- Tab switch: the active tab indicator slides smoothly between tabs

**Implementation note for Claude:** use `framer-motion` for the swipe and catch sequence — its gesture handling and `AnimatePresence` make the choreography manageable. CSS transitions are fine for buttons and tabs. Add `framer-motion` to the dependency list when implementing.

### Design Principles
- One primary action per screen — the swipe view is about deciding, nothing else
- Card is the hero — it should dominate the viewport on mobile
- Retro elements are seasoning, not the meal — if in doubt, default to the modern style
- Loading states never block the whole UI — skeleton the card screen area in GB green
- Errors are friendly and use the device metaphor where it fits ("No signal" empty state, etc.) — but never sacrifice clarity for theme

### Inspiration / References
- Original Game Boy Pokémon Red/Blue UI — for the screen frame, dot matrix, pixel font usage
- The physical Pokédex device (Gen 1 design) — for the red shell, blue lens, indicator lights
- Tinder's swipe card interaction — for the gesture mechanics and stack feel
- Linear / Vercel — for the modern chrome (typography, spacing, restraint)

### Responsive Behavior
- **Mobile (primary):** Single-column, card centered and ~90% of viewport width, tab bar fixed at the bottom (Swipe / Liked / Settings) styled like Pokédex buttons
- **Tablet:** Same single-column, more breathing room around the card
- **Desktop:** Card stays phone-sized and centered (~420px) — resist the urge to make it bigger; the device feel depends on it. Background can use a subtle GB-green gradient or dot pattern at very low opacity to fill the space.

### Accessibility
- [ ] Semantic HTML (proper headings, landmarks, labels)
- [ ] Keyboard navigable — Like/Dislike must work without a mouse (←/→ arrows)
- [ ] Color contrast meets WCAG AA (4.5:1 for body text) — pixel font requires extra care, may need to bump up size or weight
- [ ] Focus states visible on all interactive elements (use the Action Blue as focus ring)
- [ ] Alt text on Pokémon images includes the Pokémon's name
- [ ] Respects `prefers-reduced-motion` — catch animation reduces to a simple fade + Pokéball icon appearing in the Liked tab

---

## 🛠 Technical Requirements

### Stack
- **Language:** TypeScript (strict mode)
- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite via Prisma — zero-config, runs anywhere, no separate database server to install
- **Auth:** bcrypt for password hashing + JWT stored in an httpOnly cookie
- **HTTP client:** Native `fetch` (no need for `axios`)
- **State management:** TanStack Query for server state; React state/context for UI state
- **Validation:** Zod (request bodies, env vars, API responses)
- **Package manager:** npm (most universal — no pnpm/bun)
- **Node version:** 20.x LTS or higher (pin via `.nvmrc` and `engines` in `package.json`)
- **Dev convenience:** `concurrently` to run frontend and backend with a single `npm run dev` from the repo root

### Why this stack
- **Vite over Next.js:** the app is a SPA behind a login — no SEO needs, no SSR benefit. Vite is lighter, faster to set up, and the frontend/backend split is clearer for reviewers.
- **Express over Fastify:** more familiar to most reviewers, plenty of middleware, no learning curve.
- **SQLite over Postgres:** the brief explicitly cares about "runnable from a random person's computer." SQLite is a single file, no install, no Docker.
- **Prisma over Drizzle:** better DX for a small project, auto-generated types, dead-simple migrations.
- **JWT in httpOnly cookie over localStorage:** safer (no XSS exposure), works seamlessly across page reloads.

### External APIs
- **PokéAPI** (`https://pokeapi.co/`) — Pokémon data, regions, types, sprites
- **Chuck Norris API** (`https://api.chucknorris.io/`) — jokes, with category filtering for type matching
- Both APIs should be called from the backend (not directly from the browser) so responses can be cached and rate-limited cleanly. Cache PokéAPI responses aggressively — the data is effectively static.

### Joke ↔ Type Matching Strategy
- Chuck Norris API exposes joke categories via `/jokes/categories`
- On startup (or first request), map Pokémon types to the closest available joke category (e.g. `fire` → `explicit`/`dev` if no match — document the mapping)
- For each Pokémon, fetch a joke from its mapped category; if the API returns nothing or the type has no mapping, fall back to `/jokes/random`
- Mapping table lives in a clearly-named config file so it's easy to inspect and adjust

### Dependencies (keep minimal)
**Backend**
- `express` — HTTP server
- `bcrypt` — password hashing
- `jsonwebtoken` — auth tokens
- `cookie-parser` — read auth cookie
- `prisma` + `@prisma/client` — database access and migrations
- `zod` — input validation
- `cors` — allow the Vite dev server to talk to the API in development

**Frontend**
- `react`, `react-dom`
- `react-router-dom` — routing
- `@tanstack/react-query` — server state
- `framer-motion` — swipe gestures and the catch animation
- `tailwindcss` — styling
- `zod` — shared validation schemas with the backend

**Dev**
- `typescript`, `tsx` (or `ts-node`) — run TS directly during development
- `vite`, `@vitejs/plugin-react`
- `concurrently` — run frontend + backend together
- `eslint`, `prettier`
- `vitest` — tests

UI primitives (shadcn/ui or Radix) are optional. If you want polished components quickly, shadcn/ui is a good fit. Otherwise, hand-roll with Tailwind — for a small app, this is fine.

### Environment Variables
- All secrets (JWT secret, etc.) read from `.env`
- Provide `.env.example` with every required variable documented
- Validate env vars at startup with Zod — fail loudly if anything is missing

Expected variables:
```
DATABASE_URL=file:./dev.db
JWT_SECRET=change-me
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

### Dev Workflow
The root `package.json` exposes a single set of commands so a reviewer never has to think about which directory they're in:

```
npm install        # installs root + client + server (use npm workspaces or postinstall)
npm run db:setup   # runs prisma migrate + generates client
npm run dev        # starts client (Vite, :5173) and server (Express, :3001) together
npm run build      # builds both
npm test           # runs vitest in both
```

In dev, Vite proxies `/api/*` to `http://localhost:3001` so the frontend can call the backend without CORS hassle. Cookies work seamlessly because both run on `localhost`.

### Code Quality
- **Formatter:** Prettier (default config, committed `.prettierrc`)
- **Linter:** ESLint with TypeScript rules
- **Type safety:** TypeScript strict mode enabled (`"strict": true`)
- **Pre-commit:** Optional Husky + lint-staged to format/lint on commit

### Browser Support
- Latest 2 versions of Chrome, Firefox, Safari, Edge
- Mobile Safari and Chrome on Android (the swipe UX should feel native here)

### Performance Targets
- Initial card loads in under 1 second on a normal connection
- Next card is prefetched while the user looks at the current one — no perceived wait between swipes
- Lighthouse score 85+ on Performance and Accessibility

### Project Structure
```
pokemon-tinder/
├── client/                       # Vite + React frontend
│   ├── src/
│   │   ├── components/           # Card, TypeBadge, Button, etc.
│   │   ├── pages/                # Login, Register, Swipe, Liked, Settings
│   │   ├── hooks/                # useAuth, useSwipeDeck, useLikedPokemon
│   │   ├── lib/                  # api client, query client, utils
│   │   ├── styles/               # tailwind.css, globals
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
├── server/                       # Express backend
│   ├── src/
│   │   ├── routes/               # auth.ts, preferences.ts, pokemon.ts, choices.ts
│   │   ├── services/             # pokeapi.ts, chucknorris.ts, joke-matcher.ts
│   │   ├── middleware/           # auth.ts, error-handler.ts
│   │   ├── lib/                  # cache, env validation
│   │   ├── config/               # type-to-joke-category mapping
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
├── .env.example
├── .nvmrc
├── .gitignore
├── README.md
└── package.json                  # Root: orchestrates client + server with concurrently
```

### Naming Conventions
- **Files:** `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- **Components:** PascalCase
- **Functions / variables:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Database tables:** snake_case, plural (`users`, `liked_pokemon`)

### Data Model (sketch)
```
users
  - id (uuid)
  - username (unique)
  - password_hash
  - created_at

user_preferences
  - user_id (fk)
  - region (string)
  - types (json array)

pokemon_choices
  - id
  - user_id (fk)
  - pokemon_id (int — PokéAPI id)
  - choice ('like' | 'dislike')
  - created_at
  - unique(user_id, pokemon_id)
```

---

## 📐 Code Standards

### Principles
- Clarity over cleverness — readable code wins
- Small, focused components and functions
- Comment the *why*, not the *what*
- No dead code, no commented-out blocks left behind
- Errors are handled, not swallowed — log on the server, surface friendly messages on the client

### Conventions
- Functional React components with hooks, no class components
- Named exports preferred over default exports
- Props typed explicitly with TypeScript interfaces
- Async/await over `.then()` chains
- API routes validate input with Zod before touching the database
- All external API calls go through a service module — no direct `fetch` from components or routes

### Error Handling
- Server returns consistent JSON error shape: `{ error: { code, message } }`
- Client shows user-friendly toasts/banners; never raw error objects
- Form validation feedback inline next to fields
- Network failures retry once, then degrade gracefully

### Testing
- At minimum, test the joke-matching logic (pure function — easy win)
- Test auth flows (register, login, protected route access)
- Test that disliked/liked Pokémon are correctly excluded from the deck
- Use Vitest or Jest — whichever fits the framework

---

## 🧪 Quality Checklist

Before considering the project done, verify:
- [ ] All must-have features work end-to-end
- [ ] README explains setup with prerequisites, install, env vars, and run commands — for macOS, Linux, and Windows
- [ ] App launches cleanly with `npm install && npm run dev` (or equivalent documented command) on a fresh clone
- [ ] `.env.example` is complete and accurate; missing env vars fail fast with a clear message
- [ ] Database migrations run automatically or are documented in the README
- [ ] Layout is responsive across mobile, tablet, desktop
- [ ] No console errors or warnings in normal use
- [ ] Forms validate input and show clear feedback
- [ ] Loading and empty states are handled (deck empty, no liked Pokémon, API down)
- [ ] Disliked Pokémon never reappear; liked Pokémon don't reappear in the deck
- [ ] Joke-to-type matching works, with a documented fallback to random
- [ ] Accessibility checks pass (keyboard, contrast, semantics)
- [ ] Code is formatted and linted, no warnings
- [ ] Git history is clean with meaningful commit messages
- [ ] Repository has a sensible `.gitignore` (no `node_modules`, no `.env`, no SQLite db file committed)

---

## 🤖 Notes for Claude

> How to be most helpful on this project.

### Communication
- Be concise. Skip preamble. Get to the code.
- When multiple approaches are reasonable, briefly note the trade-offs.
- Ask before making large architectural changes (e.g., switching frameworks, adding a new database).

### When Writing Code
- Match the style of existing files when editing.
- Include type annotations everywhere — this code is being reviewed.
- Don't add new dependencies without flagging it first and explaining why.
- Prefer simple, idiomatic solutions over clever ones.
- Build features incrementally — get something working end-to-end, then refine.
- When implementing API integrations, isolate them in a service module so they're easy to mock and swap.

### When Uncertain
- Ask clarifying questions rather than guessing — especially on ambiguous parts of the brief (e.g., what "lvl" should map to from PokéAPI, exact joke-matching strategy).
- If a requirement is ambiguous, propose an interpretation and confirm.

### Things to Avoid
- Over-engineering — this is a focused project, not a platform. No microservices, no Kubernetes, no Redis unless there's a real reason.
- Adding features that aren't on the list (no chat, no matching algorithm, no notifications).
- Refactoring unrelated code while working on a feature.
- Leaving TODOs without flagging them in the response.
- Hardcoding API responses — both APIs are live and reliable, integrate properly.
- Skipping the README — it's an explicit grading criterion.

### Context That Matters
- This will be reviewed by humans for **code quality**, not just whether it works. Clean abstractions, sensible names, and obvious structure matter more than cramming in extra features.
- The brief explicitly says "the app should be runnable from a random person's computer" — test your README on a fresh checkout before submitting.
- Cross-platform setup matters: avoid bash-only scripts in `package.json`. Use cross-platform tools (`cross-env`, `rimraf`) if needed.

---

*Last updated: [YYYY-MM-DD]*
