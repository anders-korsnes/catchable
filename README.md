# Catchable

A Tinder-style web app where you swipe and catch Pokémons. Each Pokémon gets a random human name and a Chuck Norris joke matched to its type, revealed when you catch it. React + Vite frontend, Express + Prisma + SQLite backend, all TypeScript.

---

## Installation

### What you need

- **Node.js** version 20 or higher — check with `node --version`
- **npm** version 10 or higher — check with `npm --version`

If you use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows), there's an `.nvmrc` in the repo root. Run `nvm use` and it'll switch to the right version.

### Steps

1. **Clone the repo**

```
git clone https://github.com/anders-korsnes/catchable.git
cd PokemonTinder
```

2. **Create the environment file**

Copy `.env.example` to `.env` in the server folder:

```
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env

# Windows cmd
copy .env.example .env
```

Open `.env` and change `JWT_SECRET` to something random and at least 16 characters long. Everything else can stay as-is for local development.

3. **Install dependencies**

```
npm install
```

This installs packages for both the client and server (npm workspaces). It also automatically runs the Prisma migration and creates the SQLite database, so you don't need to do that separately.

4. **Start the app**

```
npm run dev
```

This starts both the frontend (Vite on port 5173) and the backend (Express on port 3001) at the same time. Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Create an account and use it**

Register from the login page, pick your region and types in Settings, and start catching. There's no seed data — the app pulls Pokémon from [PokéAPI](https://pokeapi.co/) and jokes from [api.chucknorris.io](https://api.chucknorris.io/) on the fly.

---

## Environment variables

All in one `.env` file at the repo root. The server validates them on startup with Zod, so if something's wrong you'll know immediately.

| Variable        | Required | Default                 | What it does                                                     |
| --------------- | -------- | ----------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`  | yes      | `file:./dev.db`         | SQLite file path, relative to `server/`. The default works fine. |
| `JWT_SECRET`    | yes      | —                       | Used to sign auth tokens. Minimum 16 characters.                 |
| `PORT`          | no       | `3001`                  | Which port the API listens on.                                   |
| `CLIENT_ORIGIN` | no       | `http://localhost:5173` | CORS origin. Should match wherever Vite is running.              |
| `NODE_ENV`      | no       | `development`           | `development`, `test`, or `production`.                          |

---

## Scripts

Run these from the repo root.

| Command            | What it does                                                  |
| ------------------ | ------------------------------------------------------------- |
| `npm install`      | Installs everything and sets up the database.                 |
| `npm run dev`      | Runs client and server together.                              |
| `npm run build`    | Builds both client and server for production.                 |
| `npm start`        | Runs the built server (production).                           |
| `npm test`         | Runs all tests.                                               |
| `npm run lint`     | Lints the whole repo.                                         |
| `npm run format`   | Formats code with Prettier.                                   |
| `npm run db:setup` | Applies pending Prisma migrations and regenerates the client. |
| `npm run db:reset` | Wipes the database and re-runs all migrations from scratch.   |

You can also target a specific workspace, e.g. `npm test --workspace server`.

---

## Project structure

```
PokemonTinder/
├── client/                  # React frontend (Vite, Tailwind, TypeScript)
│   └── src/
│       ├── components/      # Card, TypeBadge, Button, etc.
│       ├── pages/           # Login, Register, Swipe, Liked, Settings
│       ├── hooks/           # useAuth, useSwipeDeck, useLikedPokemon
│       ├── lib/             # API client, query client, utils
│       └── styles/
│
├── server/                  # Express backend (TypeScript)
│   ├── src/
│   │   ├── routes/          # auth, preferences, pokemon, choices, deck
│   │   ├── services/        # PokéAPI client, Chuck Norris joke fetcher
│   │   ├── middleware/      # auth check, error handler
│   │   ├── lib/             # env config, prisma, auth helpers, deck filter
│   │   └── config/          # type-to-joke-category mapping
|   ├── prisma/
│   |   ├── schema.prisma
│   |   └── migrations/
│   └── .env.example
│
├── .nvmrc
└── package.json             # Root workspace config
```

---

## How it works

- **Auth** — Register with username + password. Passwords are bcrypt-hashed. Sessions use a JWT in an httpOnly cookie, so the token never touches client-side JavaScript.
- **Preferences** — Users pick a region and one or more Pokémon types (pulled from PokéAPI). Stored per user.
- **Deck** — The server gets the candidate Pokémon for the user's region + types, filters out anything already caught, and returns the next card.
- **Jokes** — Pokémon types are mapped to Chuck Norris joke categories. If the mapped category fails, it falls back to a random joke, then to a hardcoded placeholder. A card always has a joke.
- **Pokedex** — Shows all caught Pokémon. Removing one puts it back in the deck.
- **Settings** — Users can at any time change their prefered regions, types, and even difficulty.

### External APIs

- [PokéAPI](https://pokeapi.co/) — Pokémon data, regions, types, sprites
- [Chuck Norris API](https://api.chucknorris.io/) — jokes by category

Both are called from the backend only.

---

## Testing

Tests use [Vitest](https://vitest.dev/) and sit next to the code they cover (`*.test.ts`).

What's covered:

- **Joke matcher** — type-to-category mapping, multi-type ordering, fallback behavior
- **Auth helpers** — bcrypt hashing round-trip, JWT sign/verify, tampered token rejection
- **Deck filtering** — candidate ordering, remaining count, filtering out caught Pokemons
- **Preferences encoding** — string array to/from the comma-separated format SQLite stores

```
npm test
```

To run just the server tests, or in watch mode:

```
npm test --workspace server
npm run test:watch --workspace server
```

---

## Troubleshooting

**"Invalid environment configuration" on startup**
You're missing `.env` or a required value in it. Copy `.env.example` to `.env` in the server folder and make sure `JWT_SECRET` is at least 16 characters.

**"Environment variable not found: DATABASE_URL" when running db:setup**
This happens if you run Prisma directly instead of through the npm script. Use `npm run db:setup` from the repo root — it handles the path correctly.

**Port already in use**
Change `PORT` in `.env`. If you also change the Vite port (in `client/vite.config.ts`), update `CLIENT_ORIGIN` to match.

**Cookies not being set**
The auth cookies only work when client and server are on the same hostname. Use `localhost` in the browser, not `127.0.0.1`.

**bcrypt fails to install on Windows**
Use Node 20+. It ships prebuilt binaries and skips compilation. Older Node versions need build tools that are annoying to set up.

**Start over from scratch**

```
npm run db:reset
```

This wipes the SQLite database and re-runs all migrations.

# catchable
