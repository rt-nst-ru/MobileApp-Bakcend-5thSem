import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadFileDto } from './dto/file.dto';
import { decodeBase64, detectImageMime, MAX_UPLOAD_MB } from '../common/base64.util';

/** The file fields we read for API responses (never the contents). */
export const FILE_SELECT = { id: true, name: true, mimeType: true, size: true, kind: true } satisfies Prisma.FileSelect;

/** What clients see for a file. `kind` is left out because the message's `type` already says it. */
export function toFileResponse({ kind, ...file }: Prisma.FileGetPayload<{ select: typeof FILE_SELECT }>) {
  return { ...file, downloadUrl: `/file/${file.id}/download` };
}

@Injectable()
export class FileService {
  constructor(private readonly prisma: PrismaService) {}

  /** Decodes a base64 upload and stores it. Images are checked against their real bytes. */
  async upload(dto: UploadFileDto, userId: string) {
    const { buffer, mimeType: dataUrlType } = decodeBase64(dto.data);
    if (buffer.length === 0) {
      throw new BadRequestException('The file is empty');
    }
    if (buffer.length > MAX_UPLOAD_MB * 1024 * 1024) {
      throw new PayloadTooLargeException(`Files can be at most ${MAX_UPLOAD_MB} MB`);
    }

    const imageType = detectImageMime(buffer);
    const declaredType = (dto.mime_type ?? dataUrlType ?? 'application/octet-stream').toLowerCase();

    // Something sent as an image must really be one (SVG is allowed, but kept as a normal file)
    if (!imageType && declaredType.startsWith('image/') && declaredType !== 'image/svg+xml') {
      throw new BadRequestException('The data is not a valid PNG, JPEG, GIF, WebP or HEIC image');
    }

    const file = await this.prisma.file.create({
      data: {
        name: dto.file_name.trim(),
        mimeType: imageType ?? declaredType,
        size: buffer.length,
        kind: imageType ? 'IMAGE' : 'FILE',
        data: new Uint8Array(buffer),
        uploadedBy: userId,
      },
      select: FILE_SELECT,
    });
    return toFileResponse(file);
  }

  /** Returns the file if the user uploaded it, or is in a conversation where it was sent. */
  async findAccessible(fileId: string, userId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException(`File '${fileId}' not found`);
    }
    if (file.uploadedBy === userId) {
      return file;
    }

    const sentToUser = await this.prisma.message.count({
      where: { fileId, conversation: { is: { participants_ids: { has: userId } } } },
    });
    if (sentToUser === 0) {
      throw new ForbiddenException('You do not have access to this file');
    }
    return file;
  }
}
