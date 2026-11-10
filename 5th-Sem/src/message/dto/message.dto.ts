import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsString, IsOptional, MinLength, ValidateIf } from 'class-validator';
import { FileResponseDto } from '../../file/dto/file.dto';

// ─── Query DTO ────────────────────────────────────────────────────────────────

export class GetMessagesDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the conversation to fetch messages from',
    example: '64b8f9e2c4a3b12d4e5f0001',
  })
  @IsMongoId()
  conversation_id: string;

  @ApiPropertyOptional({
    description:
      'Cursor for pagination — the ObjectId of the last fetched message. ' +
      'Omit on the first request; pass the oldest message ID received to load the previous page.',
    example: '64b8f9e2c4a3b12d4e5f1234',
  })
  @IsOptional()
  @IsMongoId()
  from_message_cursor?: string;
}

// ─── Request Body DTO ─────────────────────────────────────────────────────────

export class CreateMessageDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the conversation this message belongs to',
    example: '64b8f9e2c4a3b12d4e5f0001',
  })
  @IsMongoId()
  conversation_id: string;

  @ApiPropertyOptional({
    description:
      'Text content of the message. Required for text messages; optional (a caption) when file_id is given.',
    example: 'Hey, are we meeting tomorrow?',
    minLength: 1,
  })
  @ValidateIf((o) => o.file_id === undefined || o.content !== undefined)
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional({
    description: 'Id of an image or file you uploaded with POST /file',
    example: '64b8f9e2c4a3b12d4e5f9001',
  })
  @IsOptional()
  @IsMongoId()
  file_id?: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class MessageResponseDto {
  @ApiProperty({
    description: 'Unique MongoDB ObjectId of the message',
    example: '64b8f9e2c4a3b12d4e5f1234',
  })
  id: string;

  @ApiProperty({
    description: 'Text content of the message (empty string for an attachment sent without a caption)',
    example: 'Hey, are we meeting tomorrow?',
  })
  content: string;

  @ApiProperty({
    description: 'TEXT, or IMAGE / FILE when the message has an attachment',
    enum: ['TEXT', 'IMAGE', 'FILE'],
    example: 'TEXT',
  })
  type: 'TEXT' | 'IMAGE' | 'FILE';

  @ApiPropertyOptional({
    description: 'The attached file, or null. Get its contents from `downloadUrl`.',
    type: FileResponseDto,
    nullable: true,
  })
  file: FileResponseDto | null;

  @ApiProperty({
    description: 'ISO timestamp when the message was created',
    example: '2024-01-15T10:35:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'MongoDB ObjectId of the message sender (from auth header)',
    example: '64b8f9e2c4a3b12d4e5f6789',
  })
  senderId: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the conversation this message belongs to',
    example: '64b8f9e2c4a3b12d4e5f0001',
  })
  conversationId: string;

  @ApiProperty({
    description:
      'Delivery/read status keyed by participant user IDs. ' +
      'Sender starts as delivered+read=true; all others default to false.',
    example: {
      '64b8f9e2c4a3b12d4e5f6789': { delivered: true, read: true },
      '64b8f9e2c4a3b12d4e5f6790': { delivered: false, read: false },
    },
  })
  status: Record<string, { delivered: boolean; read: boolean }>;
}

export class PaginatedMessagesResponseDto {
  @ApiProperty({
    description: 'Messages for this page (oldest to newest within the page)',
    type: [MessageResponseDto],
  })
  data: MessageResponseDto[];

  @ApiPropertyOptional({
    description:
      'Pass this as from_message_cursor on the next request to load older messages. Null = no more pages.',
    example: '64b8f9e2c4a3b12d4e5f1111',
  })
  nextCursor?: string | null;

  @ApiProperty({ description: 'Items returned in this page', example: 20 })
  count: number;
}
