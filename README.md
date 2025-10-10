# ratio1-drive

A Next.js application for decentralized file management with Docker support, built on the Ratio1 Edge Network.

## Features

- **Decentralized File Storage**: Upload and manage files on the Ratio1 Edge Network
- **Real-time Status Monitoring**: Monitor CStore and R1FS service status
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS
- **Docker Support**: Containerized deployment with environment configuration
- **TypeScript**: Full type safety throughout the application

## Current Version

**v0.4.1** - Latest stable release

## GitHub Actions Workflows

This repository includes three GitHub Actions workflows:

### 1. CI (Main Workflow)

Orchestrates the entire CI/CD pipeline, including version checking and Docker builds.

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

### 2. Version Check

Automatically checks if the version in `package.json` was incremented and creates a tag if it was, or fails if it wasn't.

**Behavior:**
- ✅ If version was incremented: Creates and pushes a tag (e.g., `v0.4.1`)
- ❌ If version was not incremented: Fails the workflow with clear error message

### 3. Docker Build and Push

Automatically builds and pushes Docker images to `tvitalii/ratio1-drive` on Docker Hub.

**Setup Required:**

To enable the Docker build workflow, you need to add the following secrets to your GitHub repository:

1. Go to your repository settings → Secrets and variables → Actions
2. Add the following secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_TOKEN`: Your Docker Hub personal access token

**Triggers:**
- Called by CI workflow when version is incremented

**Image Tags:**
The workflow automatically creates tags based on:
- Latest tag for the most recent version
- Multi-platform support (linux/amd64, linux/arm64)

## Running the Container

The container expects API URLs to be passed as environment variables when starting:

```bash
docker run -p 3333:3333 \
  -e EE_CHAINSTORE_API_URL=http://host.docker.internal:8001 \
  -e EE_R1FS_API_URL=http://host.docker.internal:8002 \
  -e CSTORE_HKEY=ratio1-drive-demo-1 \
  tvitalii/ratio1-drive:latest
```

### Environment Variables

#### Required for Authentication

These variables are **required** for the authentication system to work:

- `EE_CSTORE_AUTH_HKEY`: CStore hash key that stores user credential records (e.g., `auth` or `my-app-auth`)
- `EE_CSTORE_AUTH_SECRET`: Server-side pepper/secret mixed into password hashes (e.g., a long random string)

#### Required for First-Time Setup

- `EE_CSTORE_BOOTSTRAP_ADMIN_PASS`: Password to bootstrap the initial `admin` account on first run (optional after admin user exists)

#### Service URLs

- `EE_CHAINSTORE_API_URL`: URL for the CStore API service (default: `http://localhost:30000`)
  - Alternative: `CHAINSTORE_API_URL`
- `EE_R1FS_API_URL`: URL for the R1FS API service (default: `http://localhost:30001`)
  - Alternative: `R1FS_API_URL`

#### Storage Configuration

- `CSTORE_HKEY`: Hash key for CStore file metadata operations (default: `ratio1-drive-test`)

#### Session Configuration

- `AUTH_SESSION_COOKIE`: Session cookie name (default: `r1-session`)
- `AUTH_SESSION_TTL_SECONDS`: Session lifetime in seconds (default: `86400` = 24 hours)

#### Optional Configuration

- `MAX_FILE_SIZE_MB`: Maximum file upload size in MB (default: `10`)
- `DEBUG`: Enable debug logging (default: `false`)
- `NODE_ENV`: Node.js environment (`development` or `production`)
- `NEXT_TELEMETRY_DISABLED`: Disable Next.js telemetry (default: `1`)
- `EE_CHAINSTORE_PEERS`: JSON array of additional CStore peer URLs (optional)

## Docker Compose

For local development with Docker Compose:

```bash
docker-compose up -d
```

This will start the application on port 3333 with the default environment configuration.

## Local Development

### Quick Start

1. **Create `.env.local` file** in the project root:

```bash
# Required - Authentication
EE_CSTORE_AUTH_HKEY=auth
EE_CSTORE_AUTH_SECRET=your-long-random-secret-here

# Required - First time setup (creates admin user)
EE_CSTORE_BOOTSTRAP_ADMIN_PASS=admin

# Service URLs
EE_CHAINSTORE_API_URL=http://localhost:51234
EE_R1FS_API_URL=http://localhost:51235

# Storage
CSTORE_HKEY=ratio1-drive-dev
```

2. **Install dependencies and start**:

```bash
npm install
npm run dev
```

The development server will start on `http://localhost:3333`.

### First Time Login

On first run with `EE_CSTORE_BOOTSTRAP_ADMIN_PASS` set, an admin user will be created:
- **Username**: `admin`
- **Password**: (value of `EE_CSTORE_BOOTSTRAP_ADMIN_PASS`)

After the first login, you can remove `EE_CSTORE_BOOTSTRAP_ADMIN_PASS` from `.env.local`.

## Building Locally

```bash
docker build -t ratio1-drive .
docker run -p 3333:3333 ratio1-drive
```

## API Integration

The application integrates with the Ratio1 Edge Network using the `@ratio1/edge-node-client` SDK:

- **CStore API**: For metadata storage and file indexing
- **R1FS API**: For file upload/download operations

## Project Structure

```
ratio1-drive/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── file/[cid]/        # File detail pages
│   └── page.tsx           # Main application page
├── components/             # React components
├── lib/                    # Shared libraries
│   ├── config.ts          # Environment-aware configuration
│   ├── ratio1-client.ts   # Ratio1 SDK singleton initialiser
│   ├── contexts/          # React contexts
│   ├── services/          # Client-side fetch helpers
│   ├── api-logger.ts      # API logging utilities
│   └── types.ts           # Shared domain types
├── mock-services/          # Mock services for development
└── Dockerfile             # Container configuration
```

## Technologies Used

- **Next.js 15.4.4**: React framework with App Router
- **React 19.1.0**: UI library
- **TypeScript 5.8.3**: Type safety
- **Tailwind CSS 4.1.11**: Styling
- **ratio1-edge-node-client 1.0.0**: Ratio1 Edge Network SDK
- **@ratio1/cstore-auth-ts**: CStore-backed authentication helper
- **Docker**: Containerization
- **GitHub Actions**: CI/CD automation
