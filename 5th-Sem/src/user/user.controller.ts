import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { GetUserProfileDto, UserResponseDto } from './dto/user.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('users')
@ApiSecurity('basic-auth')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Returns the profile of the target user if user_id query parameter is provided, ' +
      'otherwise returns the authenticated caller profile. ' +
      'Conversation details are omitted for privacy.',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    description: 'MongoDB ObjectId of the target user (defaults to authenticated caller)',
    example: '64b8f9e2c4a3b12d4e5f6789',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Authorization header' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getProfile(@CurrentUser() user: any, @Query() query: GetUserProfileDto) {
    const targetUserId = query.user_id || user.id;
    return this.userService.getProfile(targetUserId);
  }
}
