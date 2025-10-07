import Busboy from 'busboy';
import { PassThrough, Readable } from 'node:stream';
import { NextRequest, NextResponse } from 'next/server';
import { ApiClient } from '@/lib/api-client';
import { config } from '@/lib/config';
import { FileMetadata } from '@/lib/types';

const OWNER_HEADER = 'x-ratio1-owner';
const SECRET_HEADER = 'x-ratio1-secret';
const FILENAME_HEADER = 'x-ratio1-filename';

export const runtime = 'nodejs';

type NullableString = string | undefined | null;

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

async function handleStreamingUpload(request: NextRequest, metadata: MultipartMetadata): Promise<MultipartResult> {
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

      uploadPromise = ApiClient.uploadFileStreaming({
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
      });

      uploadResult = streamingResult.uploadResult;
      filename = streamingResult.filename || 'unknown';
      owner = streamingResult.owner || request.headers.get(OWNER_HEADER) || '';
      secret = streamingResult.secret || request.headers.get(SECRET_HEADER) || '';
      nonce = streamingResult.nonce;
    } else {
      const data = await request.json();
      filename = data.filename || 'unknown';
      secret = data.secret || '';
      owner = data.owner || '';
      nonce = parseNonce(data.nonce);
      uploadResult = await ApiClient.uploadFileBase64(data);
    }

    const cid = uploadResult?.result?.cid;
    const eeNodeAddress = uploadResult?.ee_node_address;

    if (!cid || !eeNodeAddress) {
      console.error('Missing CID or ee_node_address in upload result:', uploadResult);
      return NextResponse.json(uploadResult);
    }

    try {
      const hashGetResult = await ApiClient.hashGet(config.HKEY, eeNodeAddress);
      let metadataArray: FileMetadata[] = [];

      if (hashGetResult === null || hashGetResult === undefined) {
        metadataArray = [];
      } else {
        try {
          const parsed = JSON.parse(hashGetResult);
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

      const existingIndex = metadataArray.findIndex(item => item.cid === cid);
      if (existingIndex === -1) {
        metadataArray.push(newMetadata);
      } else {
        metadataArray[existingIndex] = newMetadata;
      }

      await ApiClient.hashSet(config.HKEY, eeNodeAddress, JSON.stringify(metadataArray));
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
