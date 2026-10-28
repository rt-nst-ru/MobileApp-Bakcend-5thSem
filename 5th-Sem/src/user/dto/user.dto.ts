import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetUserProfileDto {
  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the user to fetch. Defaults to authenticated user if omitted.',
    example: '64b8f9e2c4a3b12d4e5f6789',
  })
  @IsOptional()
  @IsMongoId()
  user_id?: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique MongoDB ObjectId of the user',
    example: '64b8f9e2c4a3b12d4e5f6789',
  })
  id: string;

  @ApiProperty({
    description: 'Display name of the user (from Basic auth username)',
    example: 'Ritesh Sharma',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Short bio or status message',
    example: 'Building cool stuff 🚀',
  })
  bio?: string;
}
