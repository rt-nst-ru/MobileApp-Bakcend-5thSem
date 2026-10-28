import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsMongoId,
  IsArray,
} from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({
    description: 'Conversation type: DM or GROUP. Defaults to DM for single participant, GROUP for multiple.',
    enum: ['DM', 'GROUP'],
    example: 'DM',
  })
  @IsOptional()
  @IsIn(['DM', 'GROUP'])
  type?: 'DM' | 'GROUP';

  @ApiPropertyOptional({
    description: 'Name of the conversation. Optional for DM, recommended for GROUP.',
    example: 'Project Alpha',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Array of participant user ObjectIds (caller is added automatically).',
    example: ['64b8f9e2c4a3b12d4e5f6790'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  participants_ids?: string[];

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of a single recipient (convenient shorthand for DM).',
    example: '64b8f9e2c4a3b12d4e5f6790',
  })
  @IsOptional()
  @IsMongoId()
  recipient_id?: string;
}

export class ConversationResponseDto {
  @ApiProperty({
    description: 'Unique MongoDB ObjectId of the conversation',
    example: '64b8f9e2c4a3b12d4e5f0001',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Name of the conversation. Null for DM conversations.',
    example: 'Study Group',
  })
  name?: string;

  @ApiProperty({
    description: 'Type of conversation: DM (direct message) or GROUP',
    example: 'DM',
    enum: ['DM', 'GROUP'],
  })
  type: string;

  @ApiProperty({
    description: 'ISO timestamp when the conversation was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'MongoDB ObjectId of the user who created this conversation',
    example: '64b8f9e2c4a3b12d4e5f6789',
  })
  createdBy: string;

  @ApiProperty({
    description: 'List of participant user ObjectIds (including creator)',
    example: ['64b8f9e2c4a3b12d4e5f6789', '64b8f9e2c4a3b12d4e5f6790'],
    type: [String],
  })
  participants_ids: string[];
}
