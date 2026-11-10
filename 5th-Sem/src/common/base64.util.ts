import { BadRequestException } from '@nestjs/common';

/** Largest upload in MB (max 15, because a MongoDB document can be at most 16 MB). */
export const MAX_UPLOAD_MB = Math.min(Number(process.env.MAX_UPLOAD_MB) || 10, 15);

/** JSON body limit: base64 text is about 4/3 the size of the file, plus room for the other fields. */
export const JSON_BODY_LIMIT = `${Math.ceil((MAX_UPLOAD_MB * 4) / 3) + 1}mb`;

/**
 * Turns base64 into bytes. Accepts plain base64 ("iVBORw0...") or a data URL
 * ("data:image/png;base64,iVBORw0..."), and returns the data URL's type if there was one.
 */
export function decodeBase64(input: string) {
  const dataUrl = /^data:([\w.+-]+\/[\w.+-]+)?[^,]*;base64,/i.exec(input);
  const base64 = input.slice(dataUrl?.[0].length ?? 0).replace(/\s/g, '');

  if (base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    throw new BadRequestException('`data` is not valid base64');
  }
  return { buffer: Buffer.from(base64, 'base64'), mimeType: dataUrl?.[1]?.toLowerCase() };
}

/** The first bytes ("magic numbers") of each image format we accept. */
const IMAGE_SIGNATURES = [
  { mime: 'image/png', offset: 0, magic: '\x89PNG' },
  { mime: 'image/jpeg', offset: 0, magic: '\xff\xd8\xff' },
  { mime: 'image/gif', offset: 0, magic: 'GIF8' },
  { mime: 'image/webp', offset: 8, magic: 'WEBP' },
  { mime: 'image/heic', offset: 4, magic: 'ftypheic' }, // iPhone photos
  { mime: 'image/heic', offset: 4, magic: 'ftypheix' },
  { mime: 'image/heif', offset: 4, magic: 'ftypmif1' },
];

/** Returns the image type the bytes really are, or null if they are not a supported image. */
export function detectImageMime(buffer: Buffer): string | null {
  const match = IMAGE_SIGNATURES.find(
    ({ offset, magic }) => buffer.toString('latin1', offset, offset + magic.length) === magic,
  );
  return match?.mime ?? null;
}
