# Chat App Backend

NestJS + Prisma + MongoDB + Swagger

## Stack

| | |
|--|--|
| Framework | NestJS v11 |
| ORM | Prisma v6 |
| Database | MongoDB 7.0 (Replica Set) |
| API Docs | Swagger UI → `http://localhost:3000/docs` |

---

## Quick Start (Docker)

```bash
# 1. Copy env
cp .env.example .env

# 2. Start everything (MongoDB + API)
npm run docker:up

# With FactBot simulation enabled
npm run docker:up:bot
```

API → `http://localhost:3000`  
Docs → `http://localhost:3000/docs`

---

## Local Dev (without Docker)

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:push
npm run start:dev

# With FactBots
npm run start:dev:bot
```

---

## Authentication

Every request needs:
```
Authorization: Basic <username>:<password>
```

- `username` → unique user identifier (display name)
- `password` → secret for the user
- If username is not found, user is **created automatically** on first request
- If username exists, password must match

---

## FactBot Simulation (`BOT_MODE=true`)

Creates 5 bot users on startup. Every 10s, **every real user** receives a random fact — each from an independently randomly picked bot. Useful for generating test chat data without manual effort.

---

## Logging

- **Interactive Message Logs**: Real messages log sender, receiver, and conversation with deterministic user colors.
- **Bot Logs**: FactBots log a single `[BOT] 🤖 Bot is Chatting...` entry per cycle.
- **MongoDB Logs**: Controlled by `MONGO_SILENT_LOGS` in `.env` (defaults to `true` to keep Docker output clean). Set to `false` for raw Mongo engine logs.

---

## API Endpoints

> Full request/response details at `http://localhost:3000/docs`

| Method | Path | Intent |
|--------|------|--------|
| `GET` | `/user` | List every registered user on the platform — use this to discover who exists before starting a conversation |
| `GET` | `/user/profile` | Fetch a specific user's profile; omit `user_id` to get your own |
| `POST` | `/conversation` | Create a new DM or group conversation; the caller is automatically added as a participant. Returns the existing DM if one already exists between the same two users |
| `GET` | `/conversation` | Fetch all conversations the authenticated user is part of |
| `POST` | `/message` | Send a message to a conversation |
| `GET` | `/message` | Fetch the message history for a given conversation |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start Docker stack |
| `npm run docker:up:bot` | Start with FactBots enabled |
| `npm run docker:down` | Stop containers |
| `npm run docker:logs` | Tail API logs |
| `npm run start:dev` | Local dev (hot-reload) |
| `npm run start:dev:bot` | Local dev + FactBots |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:push` | Push schema to DB |
