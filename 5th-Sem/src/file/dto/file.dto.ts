import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UploadFileDto {
  @ApiProperty({ description: 'File name shown in the chat', example: 'holiday.jpg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  file_name: string;

  @ApiPropertyOptional({
    description: 'Type of the file. Not needed for images or data URLs: the server detects it.',
    example: 'application/pdf',
  })
  @IsOptional()
  @Matches(/^[\w.+-]+\/[\w.+-]+$/, { message: 'mime_type must look like type/subtype, e.g. image/png' })
  mime_type?: string;

  @ApiProperty({
    description: 'File contents as plain base64 or a data URL (data:image/png;base64,...)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  })
  @IsString()
  @IsNotEmpty()
  data: string;
}

export class FileIdParamDto {
  @ApiProperty({ description: 'File id', example: '64b8f9e2c4a3b12d4e5f9001' })
  @IsMongoId()
  id: string;
}

export class FileResponseDto {
  @ApiProperty({ example: '64b8f9e2c4a3b12d4e5f9001' })
  id: string;

  @ApiProperty({ example: 'holiday.jpg' })
  name: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ description: 'Size in bytes', example: 48213 })
  size: number;

  @ApiProperty({
    description: 'Where to get the file (send the Authorization header)',
    example: '/file/64b8f9e2c4a3b12d4e5f9001/download',
  })
  downloadUrl: string;
}
