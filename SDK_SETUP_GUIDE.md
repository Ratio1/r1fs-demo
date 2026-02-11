# Ratio1 Edge Node Client Setup Guide

This guide will help you extract the SDK from the main repository and set it up as a standalone npm package.

## Overview

The Ratio1 Edge Node Client provides a comprehensive JavaScript/TypeScript client for interacting with the Ratio1 Edge Node API. It includes:

- 📁 File upload/download operations
- 🔐 Encrypted file support
- 📊 Service status monitoring
- 🛡️ Full TypeScript support
- ⚡ Automatic retry logic
- 🌐 Universal (Node.js + Browser) compatibility

## Quick Start

### 1. Extract the SDK

From the root of your r1fs-demo repository:

```bash
./sdk/scripts/extract-from-repo.sh
```

This script will:
- Copy all SDK files to the `sdk/` directory
- Set up the build configuration
- Create example files

### 2. Build and Test

```bash
cd sdk
npm install
npm run build
npm test
```

### 3. Use the SDK

```javascript
const { Ratio1EdgeNodeClient } = require('./dist/index.js');

const client = new Ratio1EdgeNodeClient({
  baseUrl: 'http://localhost:3000'
});

// List files
const files = await client.getFiles();
console.log('Files:', files);

// Upload a file
const result = await client.uploadFile(file, {
  filename: 'my-file.pdf',
  owner: 'user123'
});

// Download a file
const downloadResponse = await client.downloadFile(result.result.cid);
```

## Package Structure

```
sdk/
├── src/
│   ├── index.ts          # Main exports
│   ├── client.ts         # Main client class
│   ├── types.ts          # TypeScript definitions
│   └── __tests__/        # Test files
├── scripts/
│   ├── build.sh          # Build script
│   ├── publish.sh        # Publish script
│   └── extract-from-repo.sh # Extraction script
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript config
├── rollup.config.js      # Build configuration
├── jest.config.js        # Test configuration
├── README.md             # Documentation
├── LICENSE               # MIT License
└── .gitignore           # Git ignore rules
```

## API Endpoints Covered

The SDK provides client methods for all API endpoints:

| API Endpoint | SDK Method | Description |
|--------------|------------|-------------|
| `GET /api/files` | `getFiles()` | List all files |
| `POST /api/upload` | `uploadFile()` | Upload a file |
| `GET /api/download` | `downloadFile()` | Download a file |
| `GET /api/r1fs-status` | `getR1FSStatus()` | Get R1FS service status |
| `GET /api/cstore-status` | `getCStoreStatus()` | Get CStore service status |

## Configuration Options

```typescript
const client = new Ratio1DriveClient({
  baseUrl: 'https://your-api.com',    // API base URL
  apiKey: 'your-api-key',             // Authentication (optional)
  timeout: 30000,                     // Request timeout (ms)
  retries: 3                          // Retry attempts
});
```

## File Upload Options

```typescript
await client.uploadFile(file, {
  filename: 'custom-name.pdf',        // Custom filename
  secret: 'encryption-key',           // Encryption secret
  owner: 'user123',                   // File owner
  mode: 'streaming'                   // 'streaming' or 'base64'
});
```

## File Download Options

```typescript
await client.downloadFile(cid, {
  secret: 'decryption-key',           // Decryption secret
  mode: 'streaming'                   // 'streaming' or 'base64'
});
```

## Publishing to npm

### 1. Prepare for Publishing

```bash
cd sdk
npm login
```

### 2. Update Version (if needed)

```bash
npm version patch  # or minor, major
```

### 3. Publish

```bash
./scripts/publish.sh
```

The publish script will:
- Check you're on the main branch
- Verify no uncommitted changes
- Build the package
- Run tests
- Publish to npm

## Development Workflow

### 1. Make Changes

Edit files in `src/` directory:
- `client.ts` - Main client implementation
- `types.ts` - TypeScript definitions
- `index.ts` - Public exports

### 2. Test Changes

```bash
npm test
npm run build
```

### 3. Update Documentation

Update `README.md` with any new features or API changes.

### 4. Commit and Push

```bash
git add .
git commit -m "feat: add new feature"
git push
```

## Integration Examples

### Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>Ratio1 Drive Example</title>
</head>
<body>
    <input type="file" id="fileInput" />
    <button onclick="uploadFile()">Upload</button>

    <script type="module">
        import { Ratio1EdgeNodeClient } from 'https://unpkg.com/@ratio1/edge-node-client@latest/dist/index.esm.js';
        
        const client = new Ratio1EdgeNodeClient({
            baseUrl: 'https://your-api.com'
        });

        window.uploadFile = async () => {
            const file = document.getElementById('fileInput').files[0];
            if (file) {
                const result = await client.uploadFile(file);
                alert(`Uploaded! CID: ${result.result.cid}`);
            }
        };
    </script>
</body>
</html>
```

### Node.js Usage

```javascript
const { Ratio1EdgeNodeClient } = require('@ratio1/edge-node-client');
const fs = require('fs');

const client = new Ratio1EdgeNodeClient({
    baseUrl: 'https://your-api.com',
    apiKey: process.env.RATIO1_API_KEY
});

// Upload from disk
const buffer = fs.readFileSync('./file.pdf');
const result = await client.uploadFile(buffer, {
    filename: 'file.pdf'
});

// Download to disk
const response = await client.downloadFile(result.result.cid, {
    mode: 'streaming'
});
const downloadBuffer = await response.arrayBuffer();
fs.writeFileSync('./downloaded-file.pdf', Buffer.from(downloadBuffer));
```

### TypeScript Usage

```typescript
import { 
    Ratio1EdgeNodeClient, 
    UploadResponse, 
    FileMetadata 
} from '@ratio1/edge-node-client';

const client: Ratio1EdgeNodeClient = new Ratio1EdgeNodeClient();

async function handleUpload(file: File): Promise<UploadResponse> {
    return await client.uploadFile(file, {
        filename: file.name,
        owner: 'typescript-user'
    });
}

async function listUserFiles(): Promise<FileMetadata[]> {
    const files = await client.getFiles();
    return Object.values(files).flat();
}
```

## Troubleshooting

### Build Issues

If you encounter build errors:

1. Check TypeScript version compatibility
2. Ensure all dependencies are installed
3. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Test Issues

If tests fail:

1. Check that Jest is properly configured
2. Verify mock implementations in `src/__tests__/setup.ts`
3. Run tests with verbose output:
   ```bash
   npm test -- --verbose
   ```

### Publishing Issues

If publishing fails:

1. Ensure you're logged into npm: `npm login`
2. Check package name availability
3. Verify you're on the main branch
4. Ensure no uncommitted changes

## Support

- 📧 Email: support@ratio1.com
- 🐛 Issues: Create an issue in the repository
- 📖 Documentation: Check the README.md in the sdk directory

## License

This SDK is released under the MIT License. See the LICENSE file for details. 