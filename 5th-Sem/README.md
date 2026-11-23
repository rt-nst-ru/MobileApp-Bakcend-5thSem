d# Chat App Backend

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
| `POST` | `/message` | Send a message to a conversation — text, or an uploaded image/file via `file_id` |
| `GET` | `/message` | Fetch the message history for a given conversation |
| `POST` | `/file` | Upload an image or file as base64; returns its `id` |
| `GET` | `/file/{id}/download` | Get a file's raw bytes (for `<Image>`, viewers, saving to disk) |

---

## Image & File Upload (base64)

Files travel as **base64 inside JSON** — no multipart forms. Sending an image or a file is two calls:

**1. Upload it** — `POST /file`

```json
{
  "file_name": "holiday.jpg",
  "mime_type": "image/jpeg",
  "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
}
```

- `data` can be plain base64 or a data URL (`data:<mime>;base64,...`).
- `mime_type` is optional when `data` is a data URL, or when the file is an image (the type is detected from its bytes).
- PNG, JPEG, GIF, WebP and HEIC become `IMAGE` messages; everything else (PDF, docs, zip…) becomes a `FILE` message.
  Data that claims to be an image but isn't one is rejected with `400`.
- Maximum size: `MAX_UPLOAD_MB` in `.env` (default **10 MB**, max 15). Larger files get `413`.

Response:

```json
{
  "id": "6720f3a1c4a3b12d4e5f9001",
  "name": "holiday.jpg",
  "mimeType": "image/jpeg",
  "size": 48213,
  "downloadUrl": "/file/6720f3a1c4a3b12d4e5f9001/download"
}
```

**2. Send it in a conversation** — `POST /message` with the file's id (`content` becomes an optional caption):

```json
{ "conversation_id": "64b8f9e2c4a3b12d4e5f0001", "file_id": "6720f3a1c4a3b12d4e5f9001", "content": "Look at this!" }
```

Every message now has `type` (`TEXT` | `IMAGE` | `FILE`) and `file` (the details above, or `null`).
Message lists never include file contents — fetch them when needed with
`GET /file/{id}/download`, which returns the raw bytes with the right `Content-Type`
(images inline, other files as downloads).

It needs the usual `Authorization` header. A file can be read by its uploader and by the participants
of any conversation it was sent to; you can only send files you uploaded yourself.

**Getting base64 on the phone (Expo / React Native):**

```js
// Image from the gallery
const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
const asset = result.assets[0];
await api.post('/file', { file_name: asset.fileName ?? 'photo.jpg', mime_type: asset.mimeType, data: asset.base64 });

// Any file
const doc = (await DocumentPicker.getDocumentAsync()).assets[0];
const data = await FileSystem.readAsStringAsync(doc.uri, { encoding: FileSystem.EncodingType.Base64 });
await api.post('/file', { file_name: doc.name, mime_type: doc.mimeType, data });
```

Files are stored in the `files` collection in MongoDB as binary (`Bytes`), not as base64 text.
After pulling these changes, run `npm run prisma:generate` (Docker does this on build).

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
