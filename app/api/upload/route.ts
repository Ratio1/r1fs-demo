/**
 * File Upload API Route
 * ======================
 *
 * Handles file uploads to the R1FS distributed storage network.
 *
 * Data Flow:
 * 1. Client sends file (multipart/form-data or base64 JSON)
 * 2. Upload to R1FS via SDK → Returns CID (Content Identifier)
 * 3. Store file metadata in CStore → Announces file to network
 * 4. Return CID to client for future retrieval
 *
 * Supported Upload Methods:
 * - Streaming (multipart/form-data): Better for large files, real-time progress
 * - Base64 (JSON body): Simpler for small files, testing, mobile apps
 *
 * Headers:
 * - x-ratio1-owner: Username of file owner
 * - x-ratio1-secret: Optional encryption key (file will be encrypted if provided)
 * - x-ratio1-filename: Original filename
 */

import Busboy from 'busboy';
import { PassThrough, Readable } from 'node:stream';
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getRatio1NodeClientAsync } from '@/lib/ratio1-client';
import { FileMetadata } from '@/lib/types';

const OWNER_HEADER = 'x-ratio1-owner';
const SECRET_HEADER = 'x-ratio1-secret';
const FILENAME_HEADER = 'x-ratio1-filename';

export const runtime = 'nodejs';

type NullableString = string | undefined | null;

type Ratio1Client = Awaited<ReturnType<typeof getRatio1NodeClientAsync>>;
type R1fsClient = Ratio1Client['r1fs'];
type CstoreClient = Ratio1Client['cstore'];

interface MultipartMetadata {
  filename?: string;
  owner?: string;
  secret?: string;
  nonce?: number;
}

interface MultipartResult {
  uploadResult: any;
  filename: string;
  owner: string;
  secret: string;
  nonce?: number;
}

function parseNonce(value: NullableString | number): number | undefined {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value.trim());
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error('Unknown error');
  }
}

async function handleStreamingUpload(
  request: NextRequest,
  metadata: MultipartMetadata,
  r1fs: R1fsClient
): Promise<MultipartResult> {
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('multipart/form-data')) {
    throw new Error('Invalid content-type for streaming upload');
  }

  return new Promise<MultipartResult>((resolve, reject) => {
    let filename = metadata.filename?.trim() || '';
    let owner = metadata.owner?.trim() || '';
    let secret = metadata.secret?.trim() || '';
    let nonce = metadata.nonce;

    let uploadPromise: Promise<any> | null = null;
    let settled = false;

    const settleSuccess = (uploadResult: any) => {
      if (settled) return;
      settled = true;
      resolve({
        uploadResult,
        filename: filename || metadata.filename || 'unknown',
        owner,
        secret,
        nonce,
      });
    };

    const settleError = (error: any) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const busboy = Busboy({ headers: { 'content-type': contentType } });

    busboy.on('file', (fieldname, file, info) => {
      if (fieldname !== 'file') {
        file.resume();
        return;
      }

      if (!filename && info?.filename) {
        filename = info.filename.trim();
      }

      const passThrough = new PassThrough();
      file.pipe(passThrough);

      // Upload file stream to R1FS
      // Returns CID and node address where file is stored
      uploadPromise = r1fs.addFile({
        file: passThrough,
        filename: filename || info?.filename,
        secret: secret || undefined,
        nonce,
      });

      uploadPromise.catch((error) => {
        const err = toError(error);
        passThrough.destroy(err);
        settleError(err);
      });

      file.on('error', (error) => {
        const err = toError(error);
        passThrough.destroy(err);
        settleError(err);
      });
    });

    busboy.on('field', (fieldname, value) => {
      const trimmed = typeof value === 'string' ? value.trim() : value;

      if (fieldname === 'owner' && typeof trimmed === 'string') {
        owner = trimmed;
      } else if (fieldname === 'secret' && typeof trimmed === 'string') {
        secret = trimmed;
      } else if (fieldname === 'filename' && typeof trimmed === 'string') {
        filename = trimmed;
      } else if (fieldname === 'nonce') {
        nonce = parseNonce(typeof trimmed === 'string' ? trimmed : undefined);
      }
    });

    busboy.on('error', (error) => {
      settleError(toError(error));
    });

    busboy.on('close', async () => {
      if (settled) return;

      if (!uploadPromise) {
        settleError(new Error('No file received in upload request'));
        return;
      }

      try {
        const uploadResult = await uploadPromise;
        settleSuccess(uploadResult);
      } catch (error) {
        settleError(toError(error));
      }
    });

    try {
      const body = request.body;
      if (!body) {
        busboy.end();
      } else if (typeof (body as any).pipe === 'function') {
        (body as unknown as NodeJS.ReadableStream).pipe(busboy);
      } else {
        const nodeStream = Readable.fromWeb(body as unknown as any);
        nodeStream.on('error', (error) => {
          settleError(toError(error));
        });
        nodeStream.pipe(busboy as unknown as NodeJS.WritableStream);
      }
    } catch (error) {
      settleError(toError(error));
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Use async client with cross-fetch adapter for proper form-data stream handling
    const ratio1 = await getRatio1NodeClientAsync();
    const r1fs = ratio1.r1fs;
    const cstore = ratio1.cstore;

    const contentType = request.headers.get('content-type');
    let uploadResult;
    let filename = '';
    let owner = '';
    let secret = '';
    let nonce: number | undefined;

    if (contentType?.includes('multipart/form-data')) {
      const streamingResult = await handleStreamingUpload(request, {
        filename: request.headers.get(FILENAME_HEADER) || undefined,
        owner: request.headers.get(OWNER_HEADER) || undefined,
        secret: request.headers.get(SECRET_HEADER) || undefined,
      }, r1fs);

      uploadResult = streamingResult.uploadResult;
      filename = streamingResult.filename || 'unknown';
      owner = streamingResult.owner || request.headers.get(OWNER_HEADER) || '';
      secret = streamingResult.secret || request.headers.get(SECRET_HEADER) || '';
      nonce = streamingResult.nonce;
    } else {
      // Base64 upload mode - file content is JSON-encoded
      const data = await request.json();
      filename = data.filename || 'unknown';
      secret = data.secret || '';
      owner = data.owner || '';
      nonce = parseNonce(data.nonce);

      // Upload base64-encoded file to R1FS
      uploadResult = await r1fs.addFileBase64(data);
    }

    // Extract CID (content identifier) and node address from upload response
    // The response structure may vary - handle both wrapped and unwrapped formats
    const cid = uploadResult?.result?.cid || uploadResult?.cid;
    const eeNodeAddress = uploadResult?.ee_node_address || uploadResult?.result?.ee_node_address;

    if (!cid || !eeNodeAddress) {
      console.error('Missing CID or ee_node_address in upload result:', uploadResult);
      return NextResponse.json(uploadResult);
    }

    // ========================================================================
    // STEP 2: Announce file metadata to CStore (Discovery)
    // ========================================================================
    // After uploading to R1FS, we store metadata in CStore so other nodes
    // can discover this file. The metadata is stored under our app's HKEY,
    // keyed by the node address where the file is stored.

    try {
      // Fetch existing file list for this node (if any)
      const existing = await cstore.hget({ hkey: config.HKEY, key: eeNodeAddress });
      let metadataArray: FileMetadata[] = [];

      if (existing !== null && existing !== undefined) {
        try {
          const parsed = JSON.parse(existing as string);
          if (Array.isArray(parsed)) {
            if (typeof parsed[0] === 'string') {
              metadataArray = parsed.map((existingCid: string) => ({
                cid: existingCid,
                filename: `file_${existingCid.substring(0, 8)}`,
                date_uploaded: new Date().toISOString(),
                owner: 'Unknown',
                isEncryptedWithCustomKey: false,
              }));
            } else {
              metadataArray = parsed;
            }
          }
        } catch (parseError) {
          console.warn('Could not parse existing metadata array, starting with empty array:', parseError);
          metadataArray = [];
        }
      }

      const newMetadata: FileMetadata = {
        cid,
        filename,
        date_uploaded: new Date().toISOString(),
        owner: owner || 'Unknown',
        isEncryptedWithCustomKey: !!(secret && secret.trim()),
      };

      const existingIndex = metadataArray.findIndex((item) => item.cid === cid);
      if (existingIndex === -1) {
        metadataArray.push(newMetadata);
      } else {
        metadataArray[existingIndex] = newMetadata;
      }

      // Store updated metadata array back to CStore
      // This "announces" the new file to the network for discovery
      await cstore.hset({
        hkey: config.HKEY,
        key: eeNodeAddress,
        value: JSON.stringify(metadataArray),
      });
    } catch (hashError) {
      console.error('Error updating hash store:', hashError);
    }

    return NextResponse.json(uploadResult);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
