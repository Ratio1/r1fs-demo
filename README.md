# R1FS + CStore Starter Kit

A minimal scaffold for building applications on Ratio1's distributed storage network.

```
┌─────────────┐      ┌───────────────┐      ┌─────────────────┐
│   Browser   │─────▶│  Next.js API  │─────▶│   Edge Node     │
│     UI      │      │    (SDK)      │      │ R1FS + CStore   │
└─────────────┘      └───────────────┘      └─────────────────┘

Data Flow:
  Upload:   Browser ──file──▶ API ──▶ R1FS.addFile() ──▶ CID
  Announce: API ──CID+metadata──▶ CStore.hset()
  Discover: API ──▶ CStore.hgetall() ──▶ file list ──▶ Browser
  Download: Browser ──CID──▶ API ──▶ R1FS.getFile() ──▶ stream
```

## What is This?

This starter kit demonstrates the core pattern for building on Ratio1:

1. **Store files** in R1FS (distributed file storage) → receive a CID
2. **Announce metadata** via CStore (distributed key-value store)
3. **Discover & retrieve** files from any node in the network

Use this as a foundation for your own applications - the Ratio1 integration code is designed to be reusable.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Local Ratio1 services (sandbox or R1EN)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings (see Environment Configuration below).

### 3. Start Development Server

**Sandbox mode** (recommended for local development):
```bash
npm run sandbox
```

**Standard mode** (uses .env.local settings):
```bash
npm run dev
```

The app will be available at `http://localhost:3333`.

### 4. First Login

On first run with `EE_CSTORE_BOOTSTRAP_ADMIN_PASS` set:
- **Username**: `admin`
- **Password**: (value of `EE_CSTORE_BOOTSTRAP_ADMIN_PASS`)

Remove `EE_CSTORE_BOOTSTRAP_ADMIN_PASS` from `.env.local` after first login.

## Local Development Modes

### Option 1: r1-plugins-sandbox (Recommended)

The simplest way to develop locally. The sandbox provides local R1FS and CStore services.

1. **Install and start the sandbox**:
   ```bash
   # Install r1-plugins-sandbox (see: https://github.com/Ratio1/r1-plugins-sandbox)
   # Start with default ports:
   r1-plugins-sandbox --cstore-addr :41234 --r1fs-addr :41235
   ```

2. **Run the app in sandbox mode**:
   ```bash
   npm run sandbox
   ```

The sandbox script automatically sets the correct URLs:
- CStore: `http://localhost:41234`
- R1FS: `http://localhost:41235`

### Option 2: R1EN Docker (Devnet/Testnet)

For testing against real network conditions with a local edge node.

1. **Start an R1EN container** (Docker image details to be provided)
2. **Configure `.env.local`**:
   ```bash
   EE_CHAINSTORE_API_URL=http://localhost:31234
   EE_R1FS_API_URL=http://localhost:31235
   ```
3. **Run the app**:
   ```bash
   npm run dev
   ```

## Environment Configuration

All configuration is via environment variables. The same code works across all environments - only URLs change.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EE_CHAINSTORE_API_URL` | CStore service URL | `http://localhost:41234` |
| `EE_R1FS_API_URL` | R1FS service URL | `http://localhost:41235` |
| `EE_CSTORE_AUTH_HKEY` | Hash key for user credentials | `my-app-auth` |
| `EE_CSTORE_AUTH_SECRET` | Password hashing secret | `<random-string>` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CSTORE_HKEY` | Hash key for file metadata | `ratio1-drive-test` |
| `MAX_FILE_SIZE_MB` | Max upload size | `10` |
| `AUTH_SESSION_COOKIE` | Session cookie name | `r1-session` |
| `AUTH_SESSION_TTL_SECONDS` | Session lifetime | `86400` (24h) |
| `DEBUG` | Enable debug logging | `false` |

See `.env.example` for complete documentation.

## Concepts

### R1FS (Ratio1 File System)

A distributed, content-addressed file storage system:
- Files are stored on edge nodes and addressed by CID (Content Identifier)
- Similar to IPFS, optimized for the Ratio1 network
- Supports optional encryption with user-provided secret keys

**SDK methods**: `r1fs.addFile()`, `r1fs.getFile()`, `r1fs.addFileBase64()`, `r1fs.getFileBase64()`

### CStore (ChainStore)

A distributed key-value store for metadata and coordination:
- Used to announce/discover file metadata across the network
- Supports simple key-value and hash-based storage
- All values are JSON strings

**SDK methods**: `cstore.setValue()`, `cstore.getValue()`, `cstore.hset()`, `cstore.hget()`, `cstore.hgetall()`

### The Pattern

```
1. UPLOAD: client.r1fs.addFile(file) → returns { cid, ee_node_address }

2. ANNOUNCE: client.cstore.hset({
     hkey: 'my-app-files',
     key: ee_node_address,
     value: JSON.stringify([{ cid, filename, owner, ... }])
   })

3. DISCOVER: client.cstore.hgetall({ hkey: 'my-app-files' })
   → returns { node1: '[...]', node2: '[...]', ... }

4. DOWNLOAD: client.r1fs.getFile({ cid, secret })
   → returns file data
```

## Project Structure

```
r1fs-starter/
├── app/                      # Next.js App Router
│   ├── api/                  # Backend API routes
│   │   ├── upload/           # File upload (R1FS + CStore)
│   │   ├── download/         # File download (R1FS)
│   │   ├── files/            # List files (CStore)
│   │   ├── cstore-status/    # CStore health check
│   │   └── r1fs-status/      # R1FS health check
│   ├── login/                # Login page
│   └── page.tsx              # Main dashboard
├── components/               # React UI components
├── lib/
│   ├── ratio1-client.ts      # SDK client singleton (REUSE THIS!)
│   ├── config.ts             # Environment configuration
│   ├── types.ts              # TypeScript interfaces
│   ├── auth/                 # Authentication utilities
│   ├── contexts/             # React contexts
│   └── services/             # Client-side API helpers
└── .env.example              # Environment template
```

### Key Files to Understand

- **`lib/ratio1-client.ts`** - Centralized SDK initialization. Reuse this pattern in your apps.
- **`lib/config.ts`** - Environment-aware configuration. Demonstrates the zero-diff approach.
- **`app/api/upload/route.ts`** - Complete upload flow: R1FS store → CStore announce.
- **`app/api/files/route.ts`** - Discovery flow: CStore query → parse → transform.

## Using This as a Starter

1. **Clone and customize** - Replace the demo UI with your domain-specific interface
2. **Keep the integration** - The `lib/ratio1-client.ts` and `lib/config.ts` work as-is
3. **Use your own HKEY** - Change `CSTORE_HKEY` to namespace your app's data
4. **Extend the API** - Add your own routes following the patterns in `app/api/`

## Docker Deployment

### Build and Run

```bash
docker build -t r1fs-starter .
docker run -p 3333:3333 \
  -e EE_CHAINSTORE_API_URL=http://host.docker.internal:41234 \
  -e EE_R1FS_API_URL=http://host.docker.internal:41235 \
  -e EE_CSTORE_AUTH_HKEY=my-auth \
  -e EE_CSTORE_AUTH_SECRET=my-secret \
  r1fs-starter
```

### Docker Compose

```bash
docker-compose up -d
```

## Tech Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **@ratio1/edge-sdk-ts** - R1FS + CStore SDK
- **@ratio1/cstore-auth-ts** - Authentication helper

## License

MIT

---

For more information about the Ratio1 network, visit [ratio1.ai](https://ratio1.ai).
